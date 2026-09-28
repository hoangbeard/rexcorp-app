// Kho dữ liệu trong bộ nhớ (in-memory). Không có database: khởi động lại là mất dữ liệu.
// Dữ liệu mẫu là hư cấu, chỉ phục vụ khóa học.

const SEED_PRODUCTS = [
  { id: 'rx-100', name: 'RexBoard Mini', category: 'hardware', price: 49 },
  { id: 'rx-200', name: 'RexCloud Starter', category: 'service', price: 19 },
  { id: 'rx-300', name: 'RexSensor Pro', category: 'hardware', price: 129 },
  { id: 'rx-400', name: 'RexSupport Plus', category: 'service', price: 99 },
];

const SEED_NOTES = [
  { productId: 'rx-100', author: 'an.nguyen', text: 'Bản mini dùng cho demo nội bộ.' },
  { productId: 'rx-300', author: 'binh.tran', text: 'Cần kiểm tra lại tồn kho quý 4.' },
];

export function createStore() {
  const products = new Map(SEED_PRODUCTS.map((p) => [p.id, { ...p }]));
  const notes = [];
  let nextNoteId = 1;

  function addNote(productId, { author, text }) {
    const note = {
      id: nextNoteId++,
      productId,
      author,
      text,
      createdAt: new Date().toISOString(),
    };
    notes.push(note);
    return note;
  }

  for (const seed of SEED_NOTES) {
    addNote(seed.productId, seed);
  }

  return {
    listProducts({ category } = {}) {
      const all = [...products.values()];
      return category ? all.filter((p) => p.category === category) : all;
    },

    getProduct(id) {
      return products.get(id) ?? null;
    },

    listNotes(productId) {
      return notes.filter((n) => n.productId === productId);
    },

    addNote,
  };
}
