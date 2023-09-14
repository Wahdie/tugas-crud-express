const express = require("express");
const morgan = require("morgan");
const session = require("express-session");
const validator = require("validator");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const { body, validationResult, check } = require("express-validator");
const {
  loadContact,
  findContact,
  addContact,
  cekDuplikat,
  deleteContact,
  updateContact,
  saveContact,
} = require("./utils/contacts");

const app = express();

const port = 3000;
app.set("view engine", "ejs");

// menjalankan time date secara otomatis
app.use((req, res, next) => {
  console.log("Time : ", Date.now());
  next();
});
app.use(express.json());

//==============built-in middleare================
// membuat static untuk mengelola folder assets
app.use(express.static("public"));
// menerima data dari form kontak dan mengolahnya
app.use(express.urlencoded({ extended: true }));
//third-party mioddleware
app.use(morgan("dev"));

// konfigurasi flash
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Middleware untuk memanggil function loadContact
const loadContactMiddleware = (req, res, next) => {
  try {
    const contacts = loadContact();
    req.contacts = contacts; // Menyimpan hasil loadContact dalam req.contacts
    next();
  } catch (error) {
    res.status(500).json({ error: "Gagal memuat data kontak" });
  }
};

// Routing untuk menampilkan semua kontak
app.get("/contacts", loadContactMiddleware, (req, res) => {
  const contacts = req.contacts;
  res.json({
    success: true,
    data: contacts,
    message: "Berhasil menampilkan data",
  });
});

// Middleware untuk menampilkan kontak berdasarkan ID
app.get("/contacts/:id", loadContactMiddleware, (req, res) => {
  const contacts = req.contacts;
  const id = req.params.id;
  const contact = contacts.find((c) => c.id == id);

  if (contact) {
    res.json({
      success: true,
      data: contact,
      message: `Berhasil menampilkan data dengan id ${id}`,
    });
  } else {
    res.status(404).json({ message: "Kontak tidak ditemukan" });
  }
});

// Middleware untuk Create data kontak baru
app.post(
  "/contacts/add",
  // validation
  [
    body("nama").custom((value) => {
      const duplikat = cekDuplikat(value);
      if (duplikat) {
        throw new Error("Nama sudah Digunakan");
      }
      return true;
    }),
    check("email").custom((value) => {
      if (!validator.isEmail(value)) {
        throw new Error("Email tidak valid");
      }
      return true;
    }),
    check("noHP").custom((value) => {
      if (!validator.isMobilePhone(value, "id-ID")) {
        throw new Error("No HP tidak valid");
      }
      return true;
    }),
  ],

  (req, res) => {
    const newContact = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return res.status(400).json({ errors: errorMessages });
    } else {
      // Simpan data kontak dengan method addContact di contact.js
      addContact(newContact);
      const contacts = loadContact();
      res.status(201).json({
        success: true,
        data: contacts,
        message: `Berhasil menambahkan data `,
        newContact: newContact,
      }); // Mengirim respons dengan status kode 201 (Created)
    }
  }
);

// Middleware untuk menghapus data kontak berdasarkan ID (HTTP DELETE)
app.delete("/contacts/delete/:id", loadContactMiddleware, (req, res) => {
  const contacts = req.contacts;
  const contactId = req.params.id; // Ambil ID kontak dari parameter URL

  // Cari indeks kontak berdasarkan ID
  const contactIndex = contacts.findIndex((contact) => contact.id == contactId);

  // Jika kontak dengan ID yang diberikan tidak ditemukan, kirim respons 404
  if (contactIndex === -1) {
    res.status(404).json({
      message: "Kontak tidak ditemukan",
    });
  } else {
    deleteContact(contactId);
    const contacts = loadContact();
    res.json({
      success: true,
      data: contacts,
      message: `Kontak dengan id ${contactId} telah dihapus`,
    });
  }

  // Hapus kontak dari daftar berdasarkan indeks
  // Mengirim respons berhasil
});

// Middleware untuk memperbarui data kontak berdasarkan ID (HTTP PUT)
app.put(
  "/contacts/update/:id",
  loadContactMiddleware,
  [
    body("nama").custom((value, { req }) => {
      const duplikat = cekDuplikat(value);
      const contacts = req.contacts;
      const id = req.params.id;
      const contact = contacts.find((c) => c.id == id);
      if (value !== contact.nama && duplikat) {
        throw new Error("Nama sudah Digunakan");
      }
      return true;
    }),
    check("email").custom((value) => {
      if (!validator.isEmail(value)) {
        throw new Error("Email tidak valid");
      }
      return true;
    }),
    check("noHP").custom((value) => {
      if (!validator.isMobilePhone(value, "id-ID")) {
        throw new Error("No HP tidak valid");
      }
      return true;
    }),
  ],

  (req, res) => {
    const errors = validationResult(req);
    const contacts = req.contacts;
    const contactId = req.params.id; // Ambil ID kontak dari parameter URL
    const updatedContact = req.body; // Data kontak yang akan diperbarui dari body request
    const oldName = req.body.nama;
    // Cari kontak berdasarkan ID
    const existingContact = contacts.find((contact) => contact.id == contactId);
    // Jika kontak dengan ID yang diberikan tidak ditemukan, kirim respons 404
    if (!existingContact) {
      return res.status(404).json({
        message: "Kontak tidak ditemukan",
      });
    }
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return res.status(400).json({ errors: errorMessages });
    } else {
      const newContact = {
        id: parseInt(contactId),
        nama: updatedContact.nama,
        noHP: updatedContact.noHP,
        email: updatedContact.email,
      };
      // push update kontak
      updateContact(newContact);
      // respone jika berhasil
      res.json({
        success: true,
        updatedContact: newContact,
        message: `Data kontak ${contactId} berhasil diubah`,
      }); // Mengirim respons dengan data kontak yang telah diperbarui
    }
  }
);

// akan  selalu dijalankan.Jadi jangan taruh di bagian depan. Ini akan ditampilkan jika kode app.get diatasnya tidak ada
app.use("/", (req, res) => {
  res.status(404);
  res.send("Gak ada");
});

app.listen(port, () => {
  console.log(
    `Example app listening on port ${port} at http://localhost:${port}`
  );
});
