const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('library.db', (err) => {
    if (err) {
        console.log(err.message);
    } else {
        console.log('connected to database');
    }
});

db.serialize(() => {
    db.run(`
       CREATE TABLE IF NOT EXISTS Librarians(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            password TEXT
        )
    `, (err) => {
        if (!err) {
            console.log('Librarians table has been created');
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS Students(
            usn PRIMARY KEY,
            name TEXT,
            branch TEXT
        )
    `, (err) => {
        if (!err) {
            console.log('Students table has been created');
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS Books(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            author TEXT,
            quantity INTEGER
        )
    `, (err) => {
        if (!err) {
            console.log('Books table has been created');
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS BorrowedBooks(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usn TEXT,
            book_id INTEGER,
            borrowed_date TEXT,
            return_date TEXT,
            status TEXT
        )
    `, (err) => {
        if (!err) {
            console.log('BorrowedBooks table has been created');
        }
    });

   db.run(`
    CREATE TABLE IF NOT EXISTS LibraryVisits(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usn TEXT,
        entry_time TEXT,
        exit_time TEXT,
        duration TEXT,
        visit_date TEXT
    )
`, (err) => {
    if (!err) {
        console.log('LibraryVisits table created');
    } else {
        console.log(err.message);
    }
});
    db.run(`
        INSERT OR IGNORE INTO Librarians(id, name, email, password)VALUES
        (1, 'Raghunandan','raghunandan@nmamit.in','abc@123'),
        (2, 'Puneeth','puneeth@nmamit.in','password'),
        (3, 'Ananth Kumar','ananth@nmamit.in','ananth@123'),
        (4, 'Shubham Prakash','shubham@gmail.com','shub@123')

    `, (err) => {
        if (!err) {
            console.log('Inserted into Librarians');
        }
    });

    db.all(`SELECT * FROM Librarians`, (err, rows) => {
        if (!err) {
            console.table(rows);
        }
    })
});

module.exports = db;