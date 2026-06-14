const express = require('express');
const app = express();
const path = require('path');
const db = require('./db');
const session = require('express-session');

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "librarysecret",
        resave: false,
        saveUninitialized: false
    })
);
function isLoggedIn(req, res, next) {
    if (req.session.librarian) {
        next();
    } else {
        res.redirect("/");
    }
}

app.get("/", (req, res) => {
    res.render("login", { error: null });
});

app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    db.get(
        "SELECT * FROM LIBRARIANS WHERE email = ? AND password = ?",
        [email, password],
        (err, row) => {
            if (err) {
                console.log(err);
            }

            if (row) {
                req.session.librarian = row;
                res.redirect("/dashboard");
            } else {
                res.render("login", { error: "Invalid Credentials" });
            }
        }
    );
});

app.get("/dashboard", isLoggedIn, (req, res) => {
    db.get("SELECT COUNT(*) AS totalBooks FROM Books", (err, books) => {
        db.get(
            "SELECT COUNT(*) AS totalBorrowed FROM BorrowedBooks",
            (err, borrowed) => {
                db.get(
                    "SELECT COUNT(*) AS totalVisits FROM LibraryVisits",
                    (err, visits) => {
                        res.render("dashboard", {
                            librarian: req.session.librarian,
                            totalBooks: books.totalBooks,
                            totalBorrowed: borrowed.totalBorrowed,
                            totalVisits: visits.totalVisits
                        });
                    });
            });
    });
});

app.get('/books', (req, res) => {
    db.all(`SELECT * FROM Books`, (er, rows) => {
        res.render("books", { books: rows })
    })
})

app.get('/books/add', (req, res) => {
    res.render('addbook')
})

app.post('/books/add', (req, res) => {
    const title = req.body.title;
    const author = req.body.author;
    const quantity = req.body.quantity;

    db.run(
        `INSERT INTO Books(title,author,quantity) VALUES(?,?,?)`,
        [title, author, quantity],
        (err) => {
            if (!err) {
                res.redirect("/books");
            } else {
                console.log(err.message);
            }
        }
    );
});
app.get('/books/delete/:id', (req, res) => {
    db.run(`DELETE FROM Books where id = ?`, [req.params.id], (err) => {
        if (!err) {
            res.redirect('/books');
        }
    })

})
app.get('/books/edit/:id', (req, res) => {
    db.get(
        `SELECT * FROM Books WHERE id = ?`,
        [req.params.id],
        (err, row) => {
            if (!err) {
                res.render("editBook", { book: row });
            } else {
                console.log(err.message);
            }
        }
    );
});

app.post('/books/edit/:id', (req, res) => {
    const title = req.body.title;
    const author = req.body.author;
    const quantity = req.body.quantity;

    db.run(
        `UPDATE Books SET title = ?, author = ?, quantity = ? WHERE id = ?`,
        [title, author, quantity, req.params.id],
        (err) => {
            if (!err) {
                res.redirect('/books');
            } else {
                console.log(err.message);
            }
        }
    );
});

app.get('/students', (req, res) => {
    db.all('SELECT * FROM Students', (err, rows) => {
        if (!err) {
            res.render('students', { students: rows });
        } else {
            console.log(err.message);
        }
    });
});
app.get('/students/add', (req, res) => {
    res.render('addStudent');
});

app.post('/students/add', (req, res) => {

    const usn = req.body.usn;
    const name = req.body.name;
    const branch = req.body.branch;

    db.run(
        `INSERT INTO Students(usn,name,branch)
         VALUES(?,?,?)`,
        [usn, name, branch],
        (err) => {
            if (!err) {
                res.redirect('/students');
            } else {
                console.log(err.message);
            }
        }
    );
});

//edit student
app.get('/students/edit/:usn', (req, res) => {
    db.get(
        'SELECT * FROM Students WHERE usn = ?',
        [req.params.usn],
        (err, row) => {
            if (!err) {
                res.render('editStudent', { student: row });
            }
        }
    );
});


app.post('/students/edit/:usn', (req, res) => {

    const name = req.body.name;
    const branch = req.body.branch;

    db.run(
        'UPDATE Students SET name=?, branch=? WHERE usn=?',
        [name, branch, req.params.usn],
        (err) => {
            if (!err) {
                res.redirect('/students');
            } else {
                console.log(err.message);
            }
        }
    );
});

//delete student
app.get('/students/delete/:usn', (req, res) => {
    db.run(
        'DELETE FROM Students WHERE usn = ?',
        [req.params.usn],
        (err) => {
            if (!err) {
                res.redirect('/students');
            } else {
                console.log(err.message);
            }
        }
    );
});

//search student!!
app.get('/students/search', (req, res) => {

    const keyword = `%${req.query.keyword}%`;

    db.all(
        `SELECT * FROM Students
         WHERE usn LIKE ?
         OR name LIKE ?`,
        [keyword, keyword],
        (err, rows) => {
            if (!err) {
                res.render('students', { students: rows });
            } else {
                console.log(err.message);
            }
        }
    );
});

//borrowed books
app.get('/borrowedbooks', (req, res) => {

    db.all(`
        SELECT BorrowedBooks.*, Books.title 
        FROM BorrowedBooks
        JOIN Books ON BorrowedBooks.book_id = Books.id
    `, (err, rows) => {

        if (err) {
            console.log(err.message);
            return;
        }

        res.render('borrowedBooks', { books: rows });

    });

});

//add borrowed books
app.get('/borrowedbooks/add', (req, res) => {
    db.all('SELECT * FROM Books', (err, books) => {
        if (!err) {
            res.render('addBorrowedBook', { books });
        } else {
            console.log(err.message);
        }
    });
});

//post add borrowed book
app.post('/borrowedbooks/add', (req, res) => {

    const usn = req.body.usn;
    const book_id = req.body.book_id;
    const borrowed_date = req.body.borrowed_date;
    const return_date = req.body.return_date;

    db.run(
        `INSERT INTO BorrowedBooks
        (usn, book_id, borrowed_date, return_date, status)
        VALUES(?,?,?,?,?)`,
        [usn, book_id, borrowed_date, return_date, 'Borrowed'],
        (err) => {

            if (!err) {

                db.run(
                    `UPDATE Books
                     SET quantity = quantity - 1
                     WHERE id = ?`,
                    [book_id]
                );

                res.redirect('/borrowedbooks');

            } else {
                console.log(err.message);
            }
        }
    );
});

//borrowedbook reurn function
app.get('/borrowedbooks/return/:id', (req, res) => {

    db.get(
        'SELECT * FROM BorrowedBooks WHERE id = ?',
        [req.params.id],
        (err, row) => {

            if (!err) {

                db.run(
                    `UPDATE BorrowedBooks
                     SET status = 'Returned'
                     WHERE id = ?`,
                    [req.params.id]
                );

                db.run(
                    `UPDATE Books
                     SET quantity = quantity + 1
                     WHERE id = ?`,
                    [row.book_id]
                );

                res.redirect('/borrowedbooks');
            }
        }
    );
});

//visits
app.get('/visits', (req, res) => {

    db.all(`SELECT * FROM LibraryVisits`, (err, rows) => {

        if (!err) {
            res.render('visits', { visits: rows });
        } else {
            console.log(err.message);
        }

    });

});

//posts visits
app.post('/visits/add', (req, res) => {

    const usn = req.body.usn;
    const entry_time = req.body.entry_time;
    const exit_time = req.body.exit_time;

    // auto date
    const visit_date = new Date().toISOString().split("T")[0];

    // duration calculation
    const [eh, em] = entry_time.split(":");
    const [xh, xm] = exit_time.split(":");

    const entryMinutes = parseInt(eh) * 60 + parseInt(em);
    const exitMinutes = parseInt(xh) * 60 + parseInt(xm);

    let diff = exitMinutes - entryMinutes;
    if (diff < 0) diff = 0;

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    const duration = `${hours}h ${minutes}m`;

    db.run(
        `INSERT INTO LibraryVisits (usn, entry_time, exit_time, duration, visit_date)
         VALUES (?, ?, ?, ?, ?)`,
        [usn, entry_time, exit_time, duration, visit_date],
        (err) => {
            if (!err) {
                res.redirect('/visits');
            } else {
                console.log(err.message);
            }
        }
    );

});

//delete visits
app.get('/visits/delete/:id', (req, res) => {

    db.run(
        `DELETE FROM LibraryVisits WHERE id = ?`,
        [req.params.id],
        (err) => {

            if (err) {
                console.log(err.message);
            }

            res.redirect('/visits');

        }
    );

});

//visits search
app.get('/visits/search', (req, res) => {

    const usn = req.query.usn;

    db.all(
        `SELECT * FROM LibraryVisits WHERE usn = ?`,
        [usn],
        (err, rows) => {

            if (err) {
                console.log(err.message);
                return;
            }

            res.render('visits', { visits: rows });

        }
    );

});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    })
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}...`);
});