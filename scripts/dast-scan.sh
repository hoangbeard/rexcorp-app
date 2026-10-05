#!/usr/bin/env bash
# Quét DAST rexcorp-app bằng ZAP, an toàn: ứng dụng và ZAP chạy trong một mạng Docker riêng,
# không publish cổng nào ra máy host và (với --internal) không có đường ra Internet.
#
#   scripts/dast-scan.sh            # chạy cả hai lượt quét, ghi báo cáo vào ./zap-out
#   DAST_OUT=/tmp/x scripts/dast-scan.sh
#
# Hai lượt quét, cùng file tiêu chí .zap/rules.tsv:
#   1. ZAP baseline: spider rồi quét thụ động (không tấn công).
#   2. ZAP API scan ở chế độ -S (safe): nạp .zap/openapi.yaml, gọi từng route, quét thụ động, bỏ quét chủ động.
# Exit code: 0 = không có FAIL (WARN không chặn); 1 = có FAIL (gate đỏ); 3 = lỗi chạy công cụ.
# Đặt DAST_FAIL_ON_WARN=1 nếu muốn WARN cũng làm script exit 2 (ZAP gốc luôn exit 2 khi chỉ có WARN).
# Đặt DAST_MIN_RULES=N (ví dụ 65) để script exit 3 khi lượt baseline chạy ít hơn N rule: khi ZAP không tải được add-on
# (môi trường không có Internet) số rule giảm âm thầm, ví dụ từ 67 xuống 61, và không có thông báo lỗi nào.
# Script này chạy giống hệt trên máy bạn và trong CI (.github/workflows/dast.yml).
#
# Giấy phép: MIT (xem LICENSE-CODE của repo khóa học).

set -euo pipefail

# ZAP 2.17.0 (Apache-2.0), image `stable` pin theo digest của index đa kiến trúc.
ZAP_IMAGE="ghcr.io/zaproxy/zaproxy:stable@sha256:5ccfff9a411743ab2615136a2edd7416bec9ce41572fa94e935df38c14adb2b6"

RUN_ID="${DAST_RUN_ID:-$$}"
NETWORK="rxdast-app-net-$RUN_ID"
APP_CONTAINER="rxdast-app-$RUN_ID"
APP_IMAGE="rexcorp-app:dast"
OUT="${DAST_OUT:-$PWD/zap-out}"

cleanup() {
  docker rm -f "$APP_CONTAINER" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
}
trap cleanup EXIT

command -v docker >/dev/null 2>&1 || { echo "Lỗi: không tìm thấy docker" >&2; exit 3; }
[ -f .zap/rules.tsv ] && [ -f .zap/openapi.yaml ] || { echo "Lỗi: chạy script từ gốc repo (cần .zap/rules.tsv và .zap/openapi.yaml)" >&2; exit 3; }

echo "== Dựng ứng dụng"
docker build --quiet --tag "$APP_IMAGE" . >/dev/null
docker network create --internal "$NETWORK" >/dev/null
docker run --detach --name "$APP_CONTAINER" --network "$NETWORK" --network-alias app \
  --read-only --security-opt no-new-privileges:true --init "$APP_IMAGE" >/dev/null

# Chờ HEALTHCHECK của Dockerfile báo healthy (tối đa 60 giây).
for _ in $(seq 1 30); do
  status="$(docker inspect --format '{{.State.Health.Status}}' "$APP_CONTAINER")"
  [ "$status" = "healthy" ] && break
  sleep 2
done
[ "$status" = "healthy" ] || { echo "Lỗi: ứng dụng không healthy ($status)" >&2; docker logs "$APP_CONTAINER" >&2; exit 3; }
echo "Ứng dụng healthy tại http://app:3000 (chỉ trong mạng $NETWORK)"

# ZAP chạy bằng user `zap` (uid 1000) trong container nên cần quyền ghi vào thư mục báo cáo.
# Chỉ xóa thư mục báo cáo mặc định (./zap-out). Nếu bạn tự đặt DAST_OUT, script không xóa gì của bạn và đòi thư mục rỗng.
[ -n "${DAST_OUT:-}" ] || rm -rf "$OUT"
[ ! -d "$OUT" ] || [ -z "$(ls -A "$OUT")" ] || { echo "Lỗi: $OUT không rỗng" >&2; exit 3; }
mkdir -p "$OUT"
chmod a+rwx "$OUT"
cp .zap/rules.tsv .zap/openapi.yaml "$OUT/"

# Mạng của ứng dụng là --internal nên ứng dụng không ra được Internet. Riêng container ZAP được nối thêm
# vào mạng `bridge` mặc định: lúc khởi động ZAP tải và cài thêm add-on quét thụ động (phải có Internet),
# nếu thiếu thì một số rule (ví dụ 90004, 10063) im lặng không chạy. Container ZAP chỉ quét mục tiêu bạn đưa vào -t.
zap() { # zap <lệnh>...
  local cid rc=0
  cid="$(docker create --network "$NETWORK" -v "$OUT":/zap/wrk:rw "$ZAP_IMAGE" "$@")"
  docker network connect bridge "$cid"
  docker start --attach "$cid" || rc=$?
  docker rm "$cid" >/dev/null
  return "$rc"
}

rc_baseline=0
rc_api=0

echo "== ZAP baseline (spider + quét thụ động)"
zap zap-baseline.py -t http://app:3000 -c rules.tsv -m 1 \
  -J baseline.json -r baseline.html -w baseline.md -s >"$OUT/baseline.log" 2>&1 || rc_baseline=$?
cat "$OUT/baseline.log"

# Số rule thật sự chạy = tổng các số trên dòng tóm tắt (FAIL-NEW … PASS).
rules_run="$(awk '/^FAIL-NEW:/ { n = 0; for (i = 1; i <= NF; i++) if ($i ~ /^[0-9]+$/) n += $i; print n }' "$OUT/baseline.log" | tail -1)"
echo "Số rule baseline đã chạy: ${rules_run:-không đọc được}"
if [ -n "${DAST_MIN_RULES:-}" ] && [ "${rules_run:-0}" -lt "$DAST_MIN_RULES" ]; then
  echo "Lỗi: baseline chỉ chạy ${rules_run:-0} rule, ít hơn DAST_MIN_RULES=$DAST_MIN_RULES. ZAP có thể không tải được add-on (xem bài 1, mục 7)." >&2
  exit 3
fi

echo "== ZAP API scan -S (OpenAPI, không quét chủ động)"
zap zap-api-scan.py -t /zap/wrk/openapi.yaml -f openapi -S -c rules.tsv \
  -J api.json -r api.html -w api.md -s || rc_api=$?

echo "== Kết quả: baseline exit=$rc_baseline, api exit=$rc_api"
rc=0
for code in "$rc_baseline" "$rc_api"; do
  case "$code" in
    1) rc=1 ;;
    3) [ "$rc" -ne 1 ] && rc=3 ;;
    2) [ "$rc" -eq 0 ] && rc=2 ;;
  esac
done
echo "Exit code tổng hợp của ZAP: $rc (0 sạch, 1 có FAIL, 2 chỉ WARN, 3 lỗi công cụ)"
if [ "$rc" -eq 2 ] && [ "${DAST_FAIL_ON_WARN:-0}" != "1" ]; then
  echo "Chỉ có WARN: không chặn (policy trong SECURITY-GATE.md)"
  rc=0
fi
exit "$rc"
