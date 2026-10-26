// Tổng hợp danh mục theo nhóm sản phẩm: số lượng, tổng giá và giá trung bình.
// Dùng Object.groupBy có sẵn trong Node.js 24 (package.json yêu cầu node >= 24.11.0), không cần thư viện ngoài.
export function summarizeByCategory(products) {
  const groups = Object.groupBy(products, (product) => product.category);
  return Object.fromEntries(
    Object.entries(groups).map(([category, items]) => {
      const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
      const averagePrice = Math.round((totalPrice / items.length) * 100) / 100;
      return [category, { count: items.length, totalPrice, averagePrice }];
    }),
  );
}
