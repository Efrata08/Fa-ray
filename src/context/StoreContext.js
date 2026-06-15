import React, { createContext, useContext, useState } from 'react';

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

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);

  function recordSale(id, qty) {
    setMedicines(prev =>
      prev.map(m => m.id === id
        ? { ...m, stock: m.stock - qty, activity: [{ type: 'sale', qty, time: timestamp() }, ...m.activity] }
        : m)
    );
  }

  function recordRestock(id, qty) {
    setMedicines(prev =>
      prev.map(m => m.id === id
        ? { ...m, stock: m.stock + qty, activity: [{ type: 'restock', qty, time: timestamp() }, ...m.activity] }
        : m)
    );
  }

  return (
    <StoreContext.Provider value={{ medicines, recordSale, recordRestock }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
