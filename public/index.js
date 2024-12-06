const signinBtn = document.getElementById("signin-btn");
const signupBtn = document.getElementById("signup-btn");
const signinForm = document.getElementById("signin-form");
const signupForm = document.getElementById("signup-form");
const sendSigninBtn = document.getElementById('sendSignin');
const sendSignupBtn = document.getElementById('sendSignup');

signinBtn.addEventListener("click", () => {
    signinForm.classList.add("active");
    signupForm.classList.remove("active");
    signinBtn.classList.add("active");
    signupBtn.classList.remove("active");

    // Change URL to /web/login
    // history.pushState(null, "", "/signin");
});

signupBtn.addEventListener("click", () => {
    signupForm.classList.add("active");
    signinForm.classList.remove("active");
    signupBtn.classList.add("active");
    signinBtn.classList.remove("active");

    // Change URL to /web/signup
    // history.pushState(null, "", "/signup");
});

window.addEventListener("popstate", () => {
    if (window.location.pathname === "/signin") {
        signinForm.classList.add("active");
        signupForm.classList.remove("active");
        signinBtn.classList.add("active");
        signupBtn.classList.remove("active");
    } else if (window.location.pathname === "/signup") {
        signupForm.classList.add("active");
        signinForm.classList.remove("active");
        signupBtn.classList.add("active");
        signinBtn.classList.remove("active");
    }
});

sendSigninBtn.addEventListener('click', async (event) => {
    event.preventDefault();

    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.style.display = 'none'; // Hide initially
    errorMessageElement.textContent = ''; // Clear previous error message
    // Collect login form data
    const username = document.querySelector('#signin-form input[name="username"]').value;
    const password = document.querySelector('#signin-form input[name="password"]').value;
    if(!username){
        errorMessageElement.textContent = 'Username is required';
        errorMessageElement.style.display = 'block';
        return
    }
    if(!password){
        errorMessageElement.textContent = 'Password is required';
        errorMessageElement.style.display = 'block';
        return
    }
    console.log({ username, password })
    try 
    {        const response = await fetch('/auth/signin', {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('Access token',data.accesstoken)
            console.log(data.message,data.accesstoken);
            // window.location.href = '/dashboard';
            
            try {
                const token = localStorage.getItem('Access token')
                console.log(token)
                if (token) {
                    // window.location.href = '/dashboard';
                    console.log("tokrn in dashboard",token)
                    const response = await fetch('https://financetracker-jlmk.onrender.com/dashboard', {
                        method: 'POST',
                        headers: {
                            'authorization': `Bearer ${token}`
                        }
                        
                    });
                    console.log("dashboard call",response.ok)
                    if (response.ok) {
                        console.log("yes.....")
                        history.pushState({}, '', '/dashboard');
                        window.location.href = '/dashboard';
          
                    } else {
                        console.error('Failed to fetch dashboard:', await response.text());
                    }
                } else {
                    console.error('No token found');
                }
                
            } catch (error) {
                console.log("error",error)
            }
            
            // Redirect or update the UI after successful login
        } else {
            console.error(data.message || "signin failed");
            errorMessageElement.textContent = 'Incorrect Username/Password';
            errorMessageElement.style.display = 'block';
            
        }
    } catch (error) {
        errorMessageElement.textContent = 'Internal Server Error.Please try again';
        errorMessageElement.style.display = 'block';
        
    }
});

sendSignupBtn.addEventListener('click', async (event) => {
    event.preventDefault();

    // Collect signup form data
    const username = document.querySelector('#signup-form input[name="username"]').value;
    const email = document.querySelector('#signup-form input[name="email"]').value;
    const password = document.querySelector('#signup-form input[name="password"]').value;
    console.log({ username, email, password })
    try {
        const response = await fetch('/auth/signup', {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('Access token',data.accesstoken)
            console.log(data.message,data.accesstoken);
            // window.location.href = '/dashboard';
            
            try {
                const token = localStorage.getItem('Access token')
                console.log(token)
                if (token) {
                    // window.location.href = '/dashboard';
                    console.log("tokrn in dashboard",token)
                    const response = await fetch('/dashboard', {
                        method: 'POST',
                        headers: {
                            'authorization': `Bearer ${token}`
                        }
                        
                    });
                    console.log("dashboard call",response.ok)
                    if (response.ok) {
                        
                        history.pushState({}, '', '/dashboard');
                        window.location.href = '/dashboard';
          
                    } else {
                        console.error('Failed to fetch dashboard:', await response.text());
                    }
                } else {
                    console.error('No token found');
                }
                
            } catch (error) {
                console.log("error",error)
            }
            
            // Redirect or update the UI after successful login
        }  else {
            console.error(data.message || "Signup failed");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});





