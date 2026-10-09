import _ from 'lodash';

// Tổng hợp danh mục theo nhóm sản phẩm: số lượng, tổng giá và giá trung bình.
export function summarizeByCategory(products) {
  return _.mapValues(_.groupBy(products, 'category'), (items) => ({
    count: items.length,
    totalPrice: _.sumBy(items, 'price'),
    averagePrice: _.round(_.meanBy(items, 'price'), 2),
  }));
}
