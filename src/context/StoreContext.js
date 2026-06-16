import React, { createContext, useContext, useState } from 'react';
import * as Notifications from 'expo-notifications';

function timestamp() {
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  return `Today, ${h}:${m} ${ampm}`;
}

const INITIAL_MEDICINES = [
  { id: 1,  name: 'Amoxicillin 250mg',      amharic: 'አሞክሲሲሊን 250 ሚ.ግ',   code: 'AMX250',  stock: 45, reorder: 20, price: 25, activity: [] },
  { id: 2,  name: 'Paracetamol 500mg',      amharic: 'ፓራሲታሞል 500 ሚ.ግ',    code: 'PCM500',  stock: 12, reorder: 15, price: 8,  activity: [] },
  { id: 3,  name: 'Metronidazole 250mg',    amharic: 'ሜትሮኒዳዞ 250 ሚ.ግ',    code: 'MTZ250',  stock: 3,  reorder: 10, price: 20, activity: [] },
  { id: 4,  name: 'ORS Sachets',            amharic: 'የኦ.አር.ኤስ ፓኬት',       code: 'ORS001',  stock: 28, reorder: 12, price: 5,  activity: [] },
  { id: 5,  name: 'Cotrimoxazole 480mg',    amharic: 'ኮትሪሞክሳዞ 480 ሚ.ግ',   code: 'CTX480',  stock: 8,  reorder: 10, price: 15, activity: [] },
  { id: 6,  name: 'Ibuprofen 400mg',        amharic: 'አይቡፕሮፌን 400 ሚ.ግ',    code: 'IBU400',  stock: 30, reorder: 15, price: 12, activity: [] },
  { id: 7,  name: 'Omeprazole 20mg',        amharic: 'ኦሜፕራዞ 20 ሚ.ግ',       code: 'OMP020',  stock: 6,  reorder: 10, price: 18, activity: [] },
  { id: 8,  name: 'Chloroquine 250mg',      amharic: 'ክሎሮኩዊን 250 ሚ.ግ',     code: 'CLQ250',  stock: 22, reorder: 15, price: 10, activity: [] },
  { id: 9,  name: 'Folic Acid 5mg',         amharic: 'ፎሊክ አሲድ 5 ሚ.ግ',      code: 'FOL005',  stock: 40, reorder: 20, price: 3,  activity: [] },
  { id: 10, name: 'Zinc Sulphate 20mg',     amharic: 'ዚንክ ሰልፌት 20 ሚ.ግ',    code: 'ZNC020',  stock: 15, reorder: 12, price: 6,  activity: [] },
  { id: 11, name: 'Vitamin A 200,000 IU',   amharic: 'ቫይታሚን ኤ 200,000 IU', code: 'VITA200', stock: 9,  reorder: 10, price: 7,  activity: [] },
  { id: 12, name: 'Mebendazole 100mg',      amharic: 'ሜቤንዳዞ 100 ሚ.ግ',      code: 'MBZ100',  stock: 33, reorder: 15, price: 9,  activity: [] },
];

async function scheduleStockAlert(medicine, newStock) {
  let title, body;

  if (newStock <= 0) {
    title = 'ክምችት አልቋል · Out of stock';
    body  = `${medicine.amharic} — ${medicine.name} is completely out of stock`;
  } else if (newStock <= medicine.reorder * 0.4) {
    title = '⚠ ወሳኝ · Critical stock';
    body  = `${medicine.amharic} — only ${newStock} units remaining`;
  } else if (newStock === medicine.reorder) {
    title = 'ክምችት እያነሰ ነው · Low stock';
    body  = `${medicine.amharic} — ${medicine.name} has reached reorder point (${newStock} units)`;
  } else {
    return; // no threshold crossed
  }

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);
  const [currentTransaction, setCurrentTransaction] = useState([]);

  function recordSale(id, qty) {
    setMedicines(prev => {
      const updated = prev.map(m => {
        if (m.id !== id) return m;
        const newStock   = m.stock - qty;
        const oldCrit    = m.stock  <= m.reorder * 0.4;
        const newCrit    = newStock  <= m.reorder * 0.4;
        const oldReorder = m.stock  <= m.reorder;
        const newReorder = newStock  <= m.reorder;
        const newOut     = newStock  <= 0;
        const oldOut     = m.stock   <= 0;

        // Fire only when crossing into a new (worse) threshold
        if ((!oldOut && newOut) || (!oldCrit && newCrit) || (!oldReorder && newReorder)) {
          scheduleStockAlert(m, newStock);
        }

        return { ...m, stock: newStock, activity: [{ type: 'sale', qty, time: timestamp() }, ...m.activity] };
      });
      return updated;
    });
  }

  function recordRestock(id, qty) {
    setMedicines(prev =>
      prev.map(m => m.id === id
        ? { ...m, stock: m.stock + qty, activity: [{ type: 'restock', qty, time: timestamp() }, ...m.activity] }
        : m)
    );
  }

  function addToTransaction(item) {
    recordSale(item.medicineId, item.quantity);
    setCurrentTransaction(prev => [...prev, item]);
  }

  function clearTransaction() {
    setCurrentTransaction([]);
  }

  return (
    <StoreContext.Provider value={{ medicines, recordSale, recordRestock, currentTransaction, addToTransaction, clearTransaction }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
