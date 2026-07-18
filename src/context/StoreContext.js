import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { autoSaveBackup, autoSaveToDownloads } from '../utils/exportData';
import { createBatch, decrementBatchesFEFO, scheduleExpiryAlert, cancelExpiryAlert } from '../utils/batches';

function formatActivityTime(date) {
  const now = new Date();
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  const time = `${h}:${m} ${ampm}`;

  if (sameDay(date, now)) return `Today, ${time}`;
  if (sameDay(date, yesterday)) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
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
  } else if (newStock <= medicine.reorder) {
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
  // Start with the full list so nothing is null while AsyncStorage loads.
  // The effect below immediately replaces this with whatever was saved from
  // a previous session (faray_medicines). If nothing was saved yet,
  // INITIAL_MEDICINES stays as the fallback until onboarding calls setInventory.
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);
  const [medicinesLoaded, setMedicinesLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('faray_medicines').then(raw => {
      if (!raw) {
        setMedicinesLoaded(true);
        return;
      }
      try {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0) {
          setMedicines(saved);
        }
      } catch {}
      setMedicinesLoaded(true);
    });
  }, []);

  // Only start persisting once the initial load has resolved, so this
  // doesn't clobber onboarding's write with the INITIAL_MEDICINES fallback.
  useEffect(() => {
    if (!medicinesLoaded) return;
    AsyncStorage.setItem('faray_medicines', JSON.stringify(medicines));
    autoSaveBackup(medicines);
    autoSaveToDownloads(medicines);
  }, [medicines, medicinesLoaded]);

  function recordSale(id, qty) {
    const now = new Date();
    let depletedNotificationIds = [];

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

        // FEFO: sell from the soonest-expiring batch first. Batches fully
        // used up here have their pending expiry reminder cancelled below —
        // no point warning about stock that's already gone.
        const { batches: newBatches, depletedIds } = decrementBatchesFEFO(m.batches || [], qty);
        depletedNotificationIds = newBatches
          .filter(b => depletedIds.includes(b.id) && b.notificationId)
          .map(b => b.notificationId);

        return {
          ...m,
          stock: newStock,
          batches: newBatches,
          // pricePerUnit snapshots what this medicine cost *at the moment of
          // sale* — price can be edited later (see updatePrice), so revenue
          // math must use this instead of the medicine's current price.
          activity: [{ type: 'sale', qty, pricePerUnit: m.price, isoDate: now.toISOString(), displayTime: formatActivityTime(now) }, ...m.activity],
        };
      });
      return updated;
    });

    depletedNotificationIds.forEach(cancelExpiryAlert);
  }

  function recordRestock(id, qty, expiryDate) {
    const now = new Date();
    const batch = createBatch({ qty, expiryDate });

    setMedicines(prev =>
      prev.map(m => {
        if (m.id !== id) return m;
        const newStock = m.stock + qty;
        return {
          ...m,
          stock: newStock,
          // Reorder point auto-calibrates to half of the biggest restock
          // seen for this medicine — so "low stock" fires once you've sold
          // through half of a typical restock, and "critical" (40% of
          // reorder, per the existing two-tier logic below) fires at 20% of
          // it. Only ratchets up, so a small top-up restock never erases a
          // larger historical baseline. Not set equal to the full restocked
          // amount — that would make a freshly restocked medicine read as
          // "needs reorder" the instant it's restocked.
          reorder: Math.max(m.reorder, Math.round(newStock * 0.5)),
          batches: [...(m.batches || []), batch],
          activity: [{ type: 'restock', qty, isoDate: now.toISOString(), displayTime: formatActivityTime(now) }, ...m.activity],
        };
      })
    );

    // Scheduling is async and shouldn't block the restock itself — once it
    // resolves, attach the notification id to the batch so a later sale that
    // fully depletes it can cancel the reminder.
    if (batch.expiryDate) {
      const medicine = medicines.find(m => m.id === id);
      if (medicine) {
        scheduleExpiryAlert(medicine, batch).then(notificationId => {
          if (!notificationId) return;
          setMedicines(prev => prev.map(m =>
            m.id === id
              ? { ...m, batches: (m.batches || []).map(b => b.id === batch.id ? { ...b, notificationId } : b) }
              : m
          ));
        });
      }
    }
  }

  function setInventory(list) {
    setMedicines(list);
  }

  function addMedicines(newItems) {
    setMedicines(prev => [...prev, ...newItems]);
  }

  function updatePrice(id, price) {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, price } : m));
  }

  return (
    <StoreContext.Provider value={{ medicines, setInventory, addMedicines, updatePrice, recordSale, recordRestock }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
