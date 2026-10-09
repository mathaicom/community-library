
import { useEffect, useState } from "react";
import "./index.css";

const KEYS = {
  books: "libraryBooks",
  members: "libraryMembers",
  transactions: "libraryTransactions",
};

function loadData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function App() {
  const [books, setBooks] = useState(() =>
    loadData(KEYS.books).map((book) => ({
      ...book,
      quantity: book.quantity ?? 1,
    }))
  );

  const [members, setMembers] = useState(() =>
    loadData(KEYS.members)
  );

  const [transactions, setTransactions] = useState(() =>
    loadData(KEYS.transactions)
  );

  // CHANGED: Open the dashboard when the app first loads.
  const [loggedIn, setLoggedIn] = useState(true);

  const [page, setPage] = useState("Dashboard");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [modal, setModal] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [isbn, setIsbn] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [memberName, setMemberName] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [role, setRole] = useState("Member");

  const [selectedMember, setSelectedMember] = useState("");

  useEffect(() => {
    localStorage.setItem(KEYS.books, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(KEYS.members, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(
      KEYS.transactions,
      JSON.stringify(transactions)
    );
  }, [transactions]);

  function nextId(items) {
    return items.length
      ? Math.max(...items.map((item) => Number(item.id) || 0)) + 1
      : 1;
  }

  function login(event) {
    event.preventDefault();

    if (username === "admin" && password === "1234") {
      setLoggedIn(true);
      setPage("Dashboard");
      setError("");
    } else {
      setError("Incorrect username or password.");
    }
  }

  function logout() {
    setLoggedIn(false);
    setUsername("");
    setPassword("");
    setError("");
    setModal("");
  }

  function openAddBook() {
    setSelectedBook(null);
    setTitle("");
    setAuthor("");
    setCategory("");
    setIsbn("");
    setQuantity("1");
    setModal("book");
  }

  function openEditBook(book) {
    setSelectedBook(book);
    setTitle(book.title || "");
    setAuthor(book.author || "");
    setCategory(book.category || "");
    setIsbn(book.isbn || "");
    setQuantity(String(book.quantity));
    setModal("book");
  }

  function saveBook(event) {
    event.preventDefault();

    if (
      !title.trim() ||
      !author.trim() ||
      !category.trim() ||
      !isbn.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }

    const amount = Number(quantity);

    if (
      quantity === "" ||
      !Number.isInteger(amount) ||
      amount < 0 ||
      (!selectedBook && amount < 1)
    ) {
      alert("Please enter a valid quantity.");
      return;
    }

    if (selectedBook) {
      setBooks((previous) =>
        previous.map((book) =>
          book.id === selectedBook.id
            ? {
                ...book,
                title: title.trim(),
                author: author.trim(),
                category: category.trim(),
                isbn: isbn.trim(),
                quantity: amount,
                status: amount > 0 ? "Available" : "Borrowed",
              }
            : book
        )
      );
    } else {
      setBooks((previous) => [
        ...previous,
        {
          id: nextId(previous),
          title: title.trim(),
          author: author.trim(),
          category: category.trim(),
          isbn: isbn.trim(),
          quantity: amount,
          status: "Available",
        },
      ]);
    }

    setModal("");
  }

  function deleteBook(id) {
    if (
      !window.confirm("Are you sure you want to delete this book?")
    ) {
      return;
    }

    setBooks((previous) =>
      previous.filter((book) => book.id !== id)
    );
  }

  function openBorrow(book) {
    if (book.quantity <= 0) {
      alert("No copies of this book are available.");
      return;
    }

    if (members.length === 0) {
      alert("Please add a member before borrowing a book.");
      return;
    }

    setSelectedBook(book);
    setSelectedMember("");
    setModal("borrow");
  }

  function borrowBook(event) {
    event.preventDefault();

    if (!selectedBook || !selectedMember) {
      alert("Please select a member.");
      return;
    }

    const book = books.find(
      (item) => item.id === selectedBook.id
    );

    if (!book || book.quantity <= 0) {
      alert("No copies of this book are available.");
      setModal("");
      return;
    }

    setBooks((previous) =>
      previous.map((item) =>
        item.id === book.id
          ? {
              ...item,
              quantity: item.quantity - 1,
              status:
                item.quantity - 1 === 0
                  ? "Borrowed"
                  : "Available",
            }
          : item
      )
    );

    setTransactions((previous) => [
      ...previous,
      {
        id: nextId(previous),
        bookId: book.id,
        memberId: Number(selectedMember),
        type: "Borrow",
        date: new Date().toLocaleDateString(),
      },
    ]);

    setModal("");
  }

  function returnBook(book) {
    if (
      !window.confirm(
        `Return one copy of "${book.title}"?`
      )
    ) {
      return;
    }

    setBooks((previous) =>
      previous.map((item) =>
        item.id === book.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              status: "Available",
            }
          : item
      )
    );

    setTransactions((previous) => [
      ...previous,
      {
        id: nextId(previous),
        bookId: book.id,
        memberId: null,
        type: "Return",
        date: new Date().toLocaleDateString(),
      },
    ]);
  }

  function openAddMember() {
    setSelectedBook(null);
    setMemberName("");
    setMembershipId("");
    setRole("Member");
    setModal("member");
  }

  function saveMember(event) {
    event.preventDefault();

    if (
      !memberName.trim() ||
      !membershipId.trim() ||
      !role.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }

    const duplicate = members.some(
      (member) =>
        String(member.membershipId || member.email || "").toLowerCase() ===
        membershipId.trim().toLowerCase()
    );

    if (duplicate) {
      alert("This membership ID is already registered.");
      return;
    }

    setMembers((previous) => [
      ...previous,
      {
        id: nextId(previous),
        name: memberName.trim(),
        membershipId: membershipId.trim(),
        role: role.trim(),
      },
    ]);

    setModal("");
  }

  function deleteMember(id) {
    const hasBorrowed = transactions.some(
      (transaction) =>
        transaction.memberId === id &&
        transaction.type === "Borrow"
    );

    if (hasBorrowed) {
      alert(
        "This member has borrowed a book and cannot be deleted."
      );
      return;
    }

    if (
      !window.confirm("Are you sure you want to delete this member?")
    ) {
      return;
    }

    setMembers((previous) =>
      previous.filter((member) => member.id !== id)
    );
  }

  function createInput(
    label,
    value,
    setter,
    placeholder,
    type = "text"
  ) {
    return (
      <div className="input-group" key={label}>
        <label>{label}</label>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => setter(event.target.value)}
          required
        />
      </div>
    );
  }

  function statCard(label, value) {
    return (
      <div className="stat-card" key={label}>
        <h3>{label}</h3>
        <p>{value}</p>
      </div>
    );
  }

  function tableCell(value) {
    return <td>{value ?? ""}</td>;
  }

  function renderDashboard() {
    const totalBooks = books.length;

    const availableBooks = books.filter(
      (book) => book.quantity > 0
    ).length;

    const borrowedBooks = books.filter(
      (book) => book.quantity === 0
    ).length;

    const lowStockBooks = books.filter(
      (book) => book.quantity <= 2
    );

    return (
      <>
        <h2>Dashboard</h2>

        <div className="stats-container">
          {statCard("Total Books", totalBooks)}
          {statCard("Available Books", availableBooks)}
          {statCard("Borrowed Books", borrowedBooks)}
          {statCard("Members", members.length)}
        </div>

        <h3>Books With Low Copies</h3>

        {lowStockBooks.length === 0 ? (
          <p>No books have low quantities.</p>
        ) : (
          <ul>
            {lowStockBooks.map((book) => (
              <li key={book.id}>
                {book.title} - {book.quantity} copies available
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  function renderBooks() {
    return (
      <>
        <div className="page-header">
          <h2>Books</h2>
          <button className="primary-btn" onClick={openAddBook}>
            Add Book
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                {[
                  "ID",
                  "Title",
                  "Author",
                  "Category",
                  "ISBN",
                  "Quantity",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {books.map((book) => (
                <tr
                  key={book.id}
                  className={
                    book.quantity <= 2 ? "low-stock-row" : ""
                  }
                >
                  {tableCell(book.id)}
                  {tableCell(book.title)}
                  {tableCell(book.author)}
                  {tableCell(book.category)}
                  {tableCell(book.isbn)}

                  <td
                    className={
                      book.quantity <= 2 ? "low-stock" : ""
                    }
                  >
                    {book.quantity}
                  </td>

                  {tableCell(
                    book.quantity === 0 ? "Borrowed" : "Available"
                  )}

                  <td>
                    {book.quantity > 0 ? (
                      <button
                        className="borrow-btn"
                        onClick={() => openBorrow(book)}
                      >
                        Borrow
                      </button>
                    ) : (
                      <button
                        className="return-btn"
                        onClick={() => returnBook(book)}
                      >
                        Return
                      </button>
                    )}

                    <button
                      className="edit-btn"
                      onClick={() => openEditBook(book)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteBook(book.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {books.length === 0 && (
            <p>No books have been added yet.</p>
          )}
        </div>
      </>
    );
  }

  function renderTransactions() {
    return (
      <>
        <h2>Transactions</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Book</th>
                <th>Type</th>
                <th>Member</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction) => {
                const book = books.find(
                  (item) => item.id === transaction.bookId
                );

                const member = members.find(
                  (item) =>
                    item.id === Number(transaction.memberId)
                );

                return (
                  <tr key={transaction.id}>
                    {tableCell(transaction.id)}
                    {tableCell(book?.title || "Unknown Book")}
                    {tableCell(transaction.type)}
                    {tableCell(member?.name || "Library User")}
                    {tableCell(transaction.date)}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {transactions.length === 0 && (
            <p>No transactions have been recorded yet.</p>
          )}
        </div>
      </>
    );
  }

  function renderMembers() {
    return (
      <>
        <div className="page-header">
          <h2>Members</h2>

          <button
            className="primary-btn"
            onClick={openAddMember}
          >
            Add Member
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Membership ID</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  {tableCell(member.id)}
                  {tableCell(member.name)}
                  {tableCell(
                    member.membershipId || member.email || ""
                  )}
                  {tableCell(member.role || member.phone || "")}

                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => deleteMember(member.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {members.length === 0 && (
            <p>No members have been registered yet.</p>
          )}
        </div>
      </>
    );
  }

  function renderModal() {
    if (!modal) return null;

    return (
      <div className="modal">
        <div className="modal-content">
          <h2>
            {modal === "book" &&
              (selectedBook ? "Edit Book" : "Add New Book")}

            {modal === "member" && "Add New Member"}
            {modal === "borrow" && "Borrow Book"}
          </h2>

          {modal === "book" && (
            <form className="modal-form" onSubmit={saveBook}>
              {createInput(
                "Title",
                title,
                setTitle,
                "Enter book title"
              )}

              {createInput(
                "Author",
                author,
                setAuthor,
                "Enter author"
              )}

              {createInput(
                "Category",
                category,
                setCategory,
                "Enter category"
              )}

              {createInput(
                "ISBN",
                isbn,
                setIsbn,
                "Enter ISBN"
              )}

              {createInput(
                "Quantity",
                quantity,
                setQuantity,
                "Enter number of copies",
                "number"
              )}

              <div className="modal-buttons">
                <button className="primary-btn" type="submit">
                  {selectedBook ? "Update Book" : "Save Book"}
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {modal === "member" && (
            <form className="modal-form" onSubmit={saveMember}>
              {createInput(
                "Name",
                memberName,
                setMemberName,
                "Enter member name"
              )}

              {createInput(
                "Membership ID",
                membershipId,
                setMembershipId,
                "Enter membership ID"
              )}

              <div className="input-group">
                <label>Role</label>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option value="Member">Member</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="modal-buttons">
                <button className="primary-btn" type="submit">
                  Save Member
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {modal === "borrow" && (
            <form className="modal-form" onSubmit={borrowBook}>
              <p>
                {selectedBook?.title} - {selectedBook?.quantity} copies
                available
              </p>

              <div className="input-group">
                <label>Select Member</label>

                <select
                  value={selectedMember}
                  onChange={(event) =>
                    setSelectedMember(event.target.value)
                  }
                  required
                >
                  <option value="">Select a member</option>

                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-buttons">
                <button className="primary-btn" type="submit">
                  Borrow
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="login-container">
        <h1>Community Library</h1>
        <p>Library Management System</p>

        <form onSubmit={login}>
          {createInput(
            "Username",
            username,
            setUsername,
            "Enter username"
          )}

          {createInput(
            "Password",
            password,
            setPassword,
            "Enter password",
            "password"
          )}

          {error && <p className="error-message">{error}</p>}

          <button className="primary-btn" type="submit">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>Community Library</h1>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <nav>
        {["Dashboard", "Books", "Transactions", "Users"].map(
          (item) => (
            <button
              key={item}
              className={page === item ? "active" : ""}
              onClick={() => setPage(item)}
            >
              {item}
            </button>
          )
        )}
      </nav>

      <main id="content">
        {page === "Dashboard" && renderDashboard()}
        {page === "Books" && renderBooks()}
        {page === "Transactions" && renderTransactions()}
        {page === "Users" && renderMembers()}
      </main>

      {renderModal()}
    </div>
  );
}

export default App;
