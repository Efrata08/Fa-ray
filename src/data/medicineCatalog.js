/**
 * Full catalog of medicines shown during onboarding (BuildInventoryScreen).
 * This is separate from the working inventory in StoreContext — it is the
 * list of options a pharmacist can pick from when setting up their store.
 *
 * stock starts at 0 for all; the pharmacist sets real stock on first sale/restock.
 */

export const MEDICINE_CATALOG = [
  { id: 1,  name: 'Amoxicillin 250mg',          amharic: 'አሞክሲሲሊን 250 ሚ.ግ',       code: 'AMX250',  stock: 0, reorder: 20, price: 25, activity: [] },
  { id: 2,  name: 'Amoxicillin 500mg',          amharic: 'አሞክሲሲሊን 500 ሚ.ግ',       code: 'AMX500',  stock: 0, reorder: 20, price: 40, activity: [] },
  { id: 3,  name: 'Paracetamol 500mg',          amharic: 'ፓራሲታሞል 500 ሚ.ግ',        code: 'PCM500',  stock: 0, reorder: 15, price: 8,  activity: [] },
  { id: 4,  name: 'Paracetamol Syrup 125mg/5ml',amharic: 'ፓራሲታሞ ሽሮፕ 125 ሚ.ግ',    code: 'PCM125S', stock: 0, reorder: 10, price: 35, activity: [] },
  { id: 5,  name: 'Ibuprofen 400mg',            amharic: 'አይቡፕሮፌን 400 ሚ.ግ',        code: 'IBU400',  stock: 0, reorder: 15, price: 12, activity: [] },
  { id: 6,  name: 'Diclofenac 50mg',            amharic: 'ዲክሎፌናክ 50 ሚ.ግ',          code: 'DCL050',  stock: 0, reorder: 15, price: 10, activity: [] },
  { id: 7,  name: 'Aspirin 300mg',              amharic: 'አስፕሪን 300 ሚ.ግ',           code: 'ASP300',  stock: 0, reorder: 20, price: 5,  activity: [] },
  { id: 8,  name: 'Metronidazole 250mg',        amharic: 'ሜትሮኒዳዞ 250 ሚ.ግ',         code: 'MTZ250',  stock: 0, reorder: 10, price: 20, activity: [] },
  { id: 9,  name: 'Metronidazole 500mg',        amharic: 'ሜትሮኒዳዞ 500 ሚ.ግ',         code: 'MTZ500',  stock: 0, reorder: 10, price: 30, activity: [] },
  { id: 10, name: 'Cotrimoxazole 480mg',        amharic: 'ኮትሪሞክሳዞ 480 ሚ.ግ',        code: 'CTX480',  stock: 0, reorder: 10, price: 15, activity: [] },
  { id: 11, name: 'Ciprofloxacin 500mg',        amharic: 'ሲፕሮፍሎክሳሲን 500 ሚ.ግ',     code: 'CIP500',  stock: 0, reorder: 15, price: 35, activity: [] },
  { id: 12, name: 'Doxycycline 100mg',          amharic: 'ዶክሲሳይክሊን 100 ሚ.ግ',       code: 'DOX100',  stock: 0, reorder: 12, price: 22, activity: [] },
  { id: 13, name: 'Azithromycin 250mg',         amharic: 'አዚትሮማይሲን 250 ሚ.ግ',      code: 'AZI250',  stock: 0, reorder: 10, price: 45, activity: [] },
  { id: 14, name: 'Erythromycin 250mg',         amharic: 'ኤርትሮማይሲን 250 ሚ.ግ',      code: 'ERY250',  stock: 0, reorder: 10, price: 28, activity: [] },
  { id: 15, name: 'Omeprazole 20mg',            amharic: 'ኦሜፕራዞ 20 ሚ.ግ',           code: 'OMP020',  stock: 0, reorder: 10, price: 18, activity: [] },
  { id: 16, name: 'ORS Sachets',                amharic: 'የኦ.አር.ኤስ ፓኬት',           code: 'ORS001',  stock: 0, reorder: 12, price: 5,  activity: [] },
  { id: 17, name: 'Chloroquine 250mg',          amharic: 'ክሎሮኩዊን 250 ሚ.ግ',         code: 'CLQ250',  stock: 0, reorder: 15, price: 10, activity: [] },
  { id: 18, name: 'Artemether-Lumefantrine',    amharic: 'አርቴሜተር-ሉሜፋንትሪን',        code: 'ALU001',  stock: 0, reorder: 12, price: 55, activity: [] },
  { id: 19, name: 'Tinidazole 500mg',           amharic: 'ቲኒዳዞ 500 ሚ.ግ',           code: 'TIN500',  stock: 0, reorder: 10, price: 18, activity: [] },
  { id: 20, name: 'Fluconazole 150mg',          amharic: 'ፍሉኮናዞ 150 ሚ.ግ',          code: 'FLC150',  stock: 0, reorder: 10, price: 30, activity: [] },
  { id: 21, name: 'Albendazole 400mg',          amharic: 'አልቤንዳዞ 400 ሚ.ግ',         code: 'ALB400',  stock: 0, reorder: 15, price: 20, activity: [] },
  { id: 22, name: 'Mebendazole 100mg',          amharic: 'ሜቤንዳዞ 100 ሚ.ግ',          code: 'MBZ100',  stock: 0, reorder: 15, price: 9,  activity: [] },
  { id: 23, name: 'Cetirizine 10mg',            amharic: 'ሴቲሪዚን 10 ሚ.ግ',           code: 'CET010',  stock: 0, reorder: 10, price: 8,  activity: [] },
  { id: 24, name: 'Loratadine 10mg',            amharic: 'ሎራታዲን 10 ሚ.ግ',           code: 'LOR010',  stock: 0, reorder: 10, price: 10, activity: [] },
  { id: 25, name: 'Prednisolone 5mg',           amharic: 'ፕሬድኒሶሎን 5 ሚ.ግ',         code: 'PRD005',  stock: 0, reorder: 10, price: 8,  activity: [] },
  { id: 26, name: 'Metformin 500mg',            amharic: 'ሜትፎርሚን 500 ሚ.ግ',         code: 'MET500',  stock: 0, reorder: 12, price: 15, activity: [] },
  { id: 27, name: 'Atenolol 50mg',              amharic: 'አቴኖሎ 50 ሚ.ግ',             code: 'ATE050',  stock: 0, reorder: 12, price: 12, activity: [] },
  { id: 28, name: 'Amlodipine 5mg',             amharic: 'አምሎዲፒን 5 ሚ.ግ',           code: 'AML005',  stock: 0, reorder: 12, price: 18, activity: [] },
  { id: 29, name: 'Folic Acid 5mg',             amharic: 'ፎሊክ አሲድ 5 ሚ.ግ',          code: 'FOL005',  stock: 0, reorder: 20, price: 3,  activity: [] },
  { id: 30, name: 'Ferrous Sulphate 200mg',     amharic: 'ፌሮስ ሰልፌት 200 ሚ.ግ',      code: 'FRS200',  stock: 0, reorder: 20, price: 5,  activity: [] },
  { id: 31, name: 'Zinc Sulphate 20mg',         amharic: 'ዚንክ ሰልፌት 20 ሚ.ግ',        code: 'ZNC020',  stock: 0, reorder: 12, price: 6,  activity: [] },
  { id: 32, name: 'Vitamin A 200,000 IU',       amharic: 'ቫይታሚን ኤ 200,000 IU',     code: 'VITA200', stock: 0, reorder: 10, price: 7,  activity: [] },
  { id: 33, name: 'Vitamin B Complex',          amharic: 'ቫይታሚን ቢ ኮምፕሌክስ',        code: 'VBC001',  stock: 0, reorder: 15, price: 12, activity: [] },
  { id: 34, name: 'Vitamin C 250mg',            amharic: 'ቫይታሚን ሲ 250 ሚ.ግ',        code: 'VTC250',  stock: 0, reorder: 15, price: 6,  activity: [] },
  { id: 35, name: 'Calcium + Vitamin D3',       amharic: 'ካልሺየም + ቫይታሚን ዲ3',      code: 'CAD001',  stock: 0, reorder: 12, price: 20, activity: [] },
];
