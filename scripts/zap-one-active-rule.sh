#!/usr/bin/env bash
# Cho thấy ZAP GỬI GÌ khi quét chủ động: chạy MỘT rule chủ động trên MỘT URL, rồi in mọi request nó gửi.
#
#   scripts/zap-one-active-rule.sh <mạng-docker> <url> <mã-rule> [id-message-cần-xem-đầy-đủ]
#   scripts/zap-one-active-rule.sh rxdast-lab-net 'http://app:3000/api/products?category=hardware' 40018 17
#
# Cần: docker, jq. Mục tiêu phải là thứ bạn tự dựng, nằm trong <mạng-docker> (nên là mạng --internal).
# Script bật ZAP ở chế độ daemon trong mạng đó (không publish cổng), tắt mọi rule chủ động trừ rule bạn chọn,
# quét đúng một URL, rồi đọc lịch sử request/response từ API của ZAP. Container ZAP bị xóa khi kết thúc.
# Không dùng cho hệ thống dùng chung: đây là quét chủ động thật.
#
# Giấy phép: MIT (xem LICENSE-CODE của repo khóa học).

set -euo pipefail

ZAP_IMAGE="ghcr.io/zaproxy/zaproxy:stable@sha256:5ccfff9a411743ab2615136a2edd7416bec9ce41572fa94e935df38c14adb2b6"
CURL_IMAGE="curlimages/curl:8.23.0@sha256:11e64e28c5f58c8d93ee95fcf22ac055f48b0bc440e0ce7d8013bbb5ad6aa8ac"

[ $# -ge 3 ] || { echo "Cách dùng: $0 <mạng-docker> <url> <mã-rule> [id-message]" >&2; exit 2; }
NET="$1"; URL="$2"; RULE="$3"; SHOW="${4:-}"
command -v docker >/dev/null 2>&1 || { echo "Lỗi: không tìm thấy docker" >&2; exit 3; }
command -v jq >/dev/null 2>&1 || { echo "Lỗi: cần jq để đọc kết quả của ZAP" >&2; exit 3; }

NAME="rxzapone-$$"
cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

zapapi() { docker run --rm --network "$NET" "$CURL_IMAGE" -s "http://zap:8080/JSON/$1"; }
enc() { jq -rn --arg v "$1" '$v|@uri'; }

# API không cần khóa vì cổng 8080 chỉ nằm trong mạng $NET (không publish ra host).
docker create --name "$NAME" --network "$NET" --network-alias zap "$ZAP_IMAGE" \
  zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true \
  -config 'api.addrs.addr.name=.*' -config api.addrs.addr.regex=true >/dev/null
docker network connect bridge "$NAME"   # chỉ để ZAP tải add-on lúc khởi động
docker start "$NAME" >/dev/null

ok=""
for _ in $(seq 1 60); do
  if zapapi 'core/view/version/' 2>/dev/null | grep -q version; then ok=1; break; fi
  sleep 2
done
[ -n "$ok" ] || { echo "Lỗi: ZAP không khởi động" >&2; docker logs "$NAME" >&2; exit 3; }

zapapi "core/action/accessUrl/?url=$(enc "$URL")&followRedirects=true" >/dev/null
zapapi 'ascan/action/disableAllScanners/' >/dev/null
zapapi "ascan/action/enableScanners/?ids=$RULE" >/dev/null
echo "Rule chủ động đang bật: $(zapapi 'ascan/view/scanners/' | jq -r '[.scanners[] | select(.enabled=="true") | "\(.id) \(.name)"] | join(", ")')"
scan="$(zapapi "ascan/action/scan/?url=$(enc "$URL")&recurse=false&inScopeOnly=false" | jq -r .scan)"
for _ in $(seq 1 120); do
  [ "$(zapapi "ascan/view/status/?scanId=$scan" | jq -r .status)" = "100" ] && break
  sleep 2
done

echo "== Mọi request trong lịch sử của ZAP (id, request, phản hồi, kích thước thân)"
zapapi 'core/view/messages/?start=0&count=500' | jq -r '.messages[] |
  "\(.id)\t\(.requestHeader | split("\r\n")[0] | sub(" HTTP/1\\.[01]$";""))\t\(.responseHeader | split("\r\n")[0])\t\(.responseBody | length)"'

echo "== Alert"
zapapi 'core/view/alerts/' | jq -r '.alerts[] | "\(.pluginId)\t\(.alert)\t\(.url)\tattack=\(.attack)\tevidence=\(.evidence)"'

if [ -n "$SHOW" ]; then
  echo "== Message $SHOW đầy đủ"
  zapapi "core/view/message/?id=$SHOW" | jq -r '.message | .requestHeader, "---", .responseHeader, .responseBody'
fi
