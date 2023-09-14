const fs = require("fs");

// membuat directory jika belum ada
const directoryPath = "./data";
const dataPath = "./data/contacts.json";
if (!fs.existsSync(directoryPath)) {
  fs.mkdirSync(directoryPath);
}
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, "[]", "utf8"); // '[]' membuat array kosong yang akan diisi kontak setiap memasukkan data
}
const loadContact = () => {
  const file = fs.readFileSync("data/contacts.json", "utf8");
  const contacts = JSON.parse(file);
  return contacts;  
};

//cetak detail
const findContact = (id) => {
  const contacts = loadContact();
  const contact = contacts.find((contact) => contact.id == id);
  console.log(`Ini contact found d contact.js: ${contact}`);
  return contact;
};
// menimpa data json dengan data baru
const saveContact = (contacts) => {
  contacts.sort((a, b) => a.id - b.id);
  fs.writeFileSync("data/contacts.json", JSON.stringify(contacts));
};
// menambah data
const addContact = (contact) => {
  const contacts = loadContact();
  const lastId = contacts.length > 0 ? contacts[contacts.length - 1].id : 0;
  console.log(contacts);
  const newContact = {
    id: lastId + 1,
    nama: contact.nama,
    noHP: contact.noHP,
    email: contact.email,
  };
  contacts.push(newContact);
  saveContact(contacts);
};

const cekDuplikat = (nama) => {
  const contacts = loadContact();
  return contacts.find((contact) => contact.nama === nama);
};

const deleteContact = (id) => {
  const contacts = loadContact();
  const newContacts = contacts.filter((contact) => contact.id != id);
  saveContact(newContacts);
};

const updateContact = (contactBaru) => {
  const contacts = loadContact();
  // hilangkan kontak yang namanya sama dengan nama lama
  const filteredContacts = contacts.filter(
    (contact) => contact.id !== contactBaru.id
  );
  // save data kontak baru kontak
  filteredContacts.push(contactBaru);
  saveContact(filteredContacts);
};
module.exports = {
  loadContact,
  findContact,
  addContact,
  cekDuplikat,
  deleteContact,
  updateContact,
  saveContact,
};
