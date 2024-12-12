document.getElementById('expense-form').addEventListener('submit', async (e) =>{
    e.preventDefault();

    const Amount = document.querySelector('input[name=amount]').value;
    const Description = document.querySelector('input[name=description]').value ||"";
    const Category= document.getElementById('Category').value
    const ExpenseType = document.getElementById('Type').value;

    const formData = {Amount,Category,ExpenseType,Description};
    console.log(formData)

    try {
        const token = localStorage.getItem('Access token')
        const response = await fetch('/dashboard/add-expense',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization':`Bearer ${token}`
            },
            body: JSON.stringify(formData),
        })
        const result = await response.json();
        if (response.ok) {
            console.log(result)
            // alert(result.message);
            showPopup()
            setTimeout(() => {
                window.location.reload();
            }, 1000);
                      
            
            // Optionally, reload the page or reset the form
            document.getElementById('form-template').reset();
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to add expense. Please try again.');
    }
});

const logoutBtn = document.getElementById('logout-btn').addEventListener('click',(e)=>{
    e.preventDefault()
    handleLogout()
});

function checkTokenExpiry() {
const token = localStorage.getItem('Access token');

console.log("token check"+token)
if (token) {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
    const expiry = payload.exp * 1000; // Convert to milliseconds
    console.log("payload "+payload)
    if (Date.now() > expiry) {
        alert("Session expired. Please log in again.");
        handleLogout(); // Clear token and redirect to login
    }
}else{
    console.log("bjd")
}
}
function handleLogout() {
localStorage.removeItem('Access token');

window.location.href = '/'; // Redirect to login page
}
checkTokenExpiry()
const formatDate = (date) => {
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = currentDate.getFullYear();
    console.log(`${day}-${month}-${year}`)
    return String(`${day}-${month}-${year}`);
};

function showPopup() {
    const popup = document.getElementById('popup');
    popup.classList.add('active');
}

function closePopup() {
    const popup = document.getElementById('popup');
    popup.classList.remove('active');
}

// Example usage
// Automatically show the popup when a transaction is saved
// Adjust timing if needed
