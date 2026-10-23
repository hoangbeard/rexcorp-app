#!/usr/bin/env bash
# Kiểm tra những requirement trong SECURITY-REQUIREMENTS.md mà máy kiểm được ngay hôm nay.
#
#   scripts/verify-requirements.sh [BASE_URL] [IMAGE]
#
#   BASE_URL  địa chỉ ứng dụng đang chạy (mặc định http://127.0.0.1:3300)
#   IMAGE     (tùy chọn) tên image của ứng dụng, để kiểm nội dung bên trong image (REQ-08)
#
# Mỗi dòng kết quả là một trong:
#   PASS     kiểm được và đạt
#   FAIL     kiểm được và KHÔNG đạt; script thoát với mã 1 (gate chặn)
#   GAP      kiểm được, chưa đạt, đã ghi trong backlog (không chặn); đổi thành PASS khi làm xong
#   PARTIAL  máy chỉ kiểm được một phần requirement; phần còn lại kiểm bằng tay
#   SKIP     tính năng chưa tồn tại nên chưa kiểm được; kiểm tra phải có trước khi merge tính năng đó
#   MANUAL   không có cách kiểm bằng script ở module này; ghi rõ module nào sẽ kiểm
#
# Cần: bash, curl. REQ-08 (image) và REQ-09 cần thêm docker.
# Giấy phép: MIT (xem LICENSE-CODE của repo khóa học).

set -uo pipefail

BASE="${1:-http://127.0.0.1:3300}"
IMAGE="${2:-}"
# Cùng image Gitleaks với pre-commit hook và job secret-scan (Lab 02).
GITLEAKS_IMAGE="${GITLEAKS_IMAGE:-ghcr.io/gitleaks/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f}"

fails=0
report() { printf '%-7s %-8s %s\n' "$1" "$2" "$3"; [ "$2" = FAIL ] && fails=$((fails + 1)); return 0; }
code() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$@"; }

command -v curl >/dev/null 2>&1 || { echo "Lỗi: cần curl" >&2; exit 2; }
[ "$(code "$BASE/healthz")" = 200 ] || { echo "Lỗi: $BASE/healthz không trả 200. Ứng dụng đã chạy chưa?" >&2; exit 2; }

# REQ-01 (ASVS v5.0.0-8.2.1): quyền truy cập theo chức năng. Hôm nay ai cũng ghi được ghi chú.
c=$(code -X POST "$BASE/api/products/rx-100/notes" -H 'Content-Type: application/json' \
  -d '{"author":"kiem.tra","text":"REQ-01: không có thông tin xác thực"}')
case "$c" in
  401|403) report REQ-01 PASS "POST không xác thực bị từ chối ($c)" ;;
  201)     report REQ-01 GAP  "POST không xác thực trả 201; chưa có đăng nhập (SEC-003)" ;;
  *)       report REQ-01 FAIL "POST không xác thực trả $c, không như kỳ vọng (401, 403 hoặc 201 đã biết)" ;;
esac

# REQ-02, 03, 05, 06: thuộc tính năng đăng nhập và tải file, chưa tồn tại.
report REQ-02 SKIP "chưa có tính năng tải file; viết test IDOR trước khi merge (SEC-007)"
report REQ-03 SKIP "chưa có đăng nhập; viết test giới hạn số lần thử trước khi merge (SEC-003)"

# REQ-04 (ASVS v5.0.0-2.2.1): kiểm tra đầu vào theo allowlist.
c1=$(code "$BASE/api/products?category=food")
c2=$(code -X POST "$BASE/api/products/rx-100/notes" -H 'Content-Type: application/json' -d '{"author":"Chi Le!","text":"ok"}')
big=$(head -c 20000 /dev/zero | tr '\0' 'x')
c3=$(code -X POST "$BASE/api/products/rx-100/notes" -H 'Content-Type: application/json' -d "{\"author\":\"a\",\"text\":\"$big\"}")
if [ "$c1" = 400 ] && [ "$c2" = 400 ] && [ "$c3" = 413 ]; then
  report REQ-04 PASS "category lạ=$c1, author sai định dạng=$c2, body 20 KB=$c3"
else
  report REQ-04 FAIL "category lạ=$c1 (cần 400), author sai=$c2 (cần 400), body 20 KB=$c3 (cần 413)"
fi

report REQ-05 SKIP "chưa có tính năng tải file; test giới hạn kích thước phải có trước khi merge (SEC-007)"
report REQ-06 SKIP "chưa có tính năng tải file; test path traversal phải có trước khi merge (SEC-007)"

# REQ-07 (ASVS v5.0.0-15.2.1): dependency trong thời hạn xử lý. Cần công cụ SCA.
report REQ-07 MANUAL "kiểm bằng SCA và gate ở module 05, 08; thời hạn xử lý viết trong SECURITY-REQUIREMENTS.md"

# REQ-08 (ASVS v5.0.0-13.4.1): không phục vụ và không đóng gói siêu dữ liệu nguồn.
bad=""
for p in /.git/config /.git/HEAD /.svn/entries; do
  [ "$(code "$BASE$p")" = 404 ] || bad="$bad $p"
done
if [ -n "$IMAGE" ] && command -v docker >/dev/null 2>&1; then
  if docker run --rm --entrypoint ls "$IMAGE" -A /app | grep -qxE '\.git|\.svn'; then bad="$bad (image chứa .git hoặc .svn)"; fi
fi
if [ -z "$bad" ]; then
  report REQ-08 PASS "không phục vụ /.git, /.svn${IMAGE:+; image không chứa .git hay .svn}"
else
  report REQ-08 FAIL "lộ siêu dữ liệu nguồn:$bad"
fi

# REQ-09 (ASVS v5.0.0-13.3.1, L2): Gitleaks chỉ kiểm được phần "không có secret trong mã nguồn".
if command -v docker >/dev/null 2>&1; then
  if docker run --rm --user "$(id -u):$(id -g)" -v "$PWD":/repo "$GITLEAKS_IMAGE" dir /repo --no-banner --redact >/dev/null 2>&1; then
    report REQ-09 PARTIAL "không có secret trong file hiện tại; phần 'có giải pháp quản lý secret' kiểm bằng tay"
  else
    report REQ-09 FAIL "Gitleaks tìm thấy secret trong file hiện tại (chạy lại không có >/dev/null để xem)"
  fi
else
  report REQ-09 SKIP "không có docker để chạy Gitleaks"
fi

echo
if [ "$fails" -gt 0 ]; then echo "Kết quả: $fails requirement KHÔNG đạt (FAIL)."; exit 1; fi
echo "Kết quả: không có FAIL. GAP và SKIP đã có trong backlog."
