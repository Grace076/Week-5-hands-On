document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form');
    const authMsg = document.getElementById('auth-msg'); // Get the auth-msg element by id

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form values using querySelector
        const date = document.querySelector('input[name="date"]').value;
        const expense_id = document.querySelector('input[name="expense_id"]').value;
        const amount = document.querySelector('input[name="amount"]').value;
        const category = document.querySelector('select[name="category"]').value;

        // Get the token from local storage (assuming it's stored there after login)
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:3000/api/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ date, expense_id, amount, category })
            });

            const data = await response.json();

            if (!response.ok) {
                authMsg.textContent = data.message || 'An error occurred';
                authMsg.style.color = 'red'; // Optional: set text color to red
            } else {
                authMsg.textContent = data.message || 'Expense added successfully';
                authMsg.style.color = 'green'; // Optional: set text color to green
            }
        } catch (err) {
            authMsg.textContent = 'An error occurred: ' + err.message;
            authMsg.style.color = 'red'; // Optional: set text color to red
        }
    });
});
