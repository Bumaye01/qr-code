document.addEventListener('DOMContentLoaded', function () {
    const generateBtn = document.querySelector('.generate-btn');

    generateBtn.addEventListener('click', function () {
        generateQRCode();
    });

    // Event listener functions for input fields
    document.querySelectorAll('.input-field').forEach(inputField => {
        inputField.addEventListener('focus', function () {
            handleInputFocus(this);
        });

        inputField.addEventListener('blur', function () {
            handleInputBlur(this);
            handleInputChange(this);
        });

        inputField.addEventListener('input', function () {
            handleInputChange(this);
        });

        handleInputChange(inputField);
    });

    function handleInputFocus(inputField) {
        inputField.nextElementSibling.classList.add("active");
    }

    function handleInputBlur(inputField) {
        if (inputField.value === '') {
            inputField.nextElementSibling.classList.remove("active");
        }
    }

    function handleInputChange(inputField) {
        if (inputField.value !== '') {
            inputField.classList.add("filled");
        } else {
            inputField.classList.remove("filled");
        }

        if (inputField.classList.contains("firstname") || inputField.classList.contains("lastname")) {
            inputField.value = inputField.value.replace(/[^a-zA-Z]/g, '');
        } else if (inputField.classList.contains("amount")) {
            inputField.value = inputField.value.replace(/[^0-9.]/g, '');
            inputField.value = inputField.value.replace(/^0+/, '');
            inputField.value = inputField.value.replace(/^\.+/, '0.');
            inputField.value = inputField.value.replace(/^0+(\d)/, '0$1');
            inputField.value = inputField.value.replace(/(\.\d{2}).*/, '$1');
        } else if (inputField.classList.contains("phone")) {
            // Update phone number validation
            inputField.value = inputField.value.replace(/[^+0-9]/g, '');
            if (inputField.value.length > 11) {
                inputField.value = inputField.value.slice(0, 11);
            }
        } else if (inputField.classList.contains("email")) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(inputField.value)) {
                inputField.nextElementSibling.classList.add("error");
            } else {
                inputField.nextElementSibling.classList.remove("error");
            }
        }
    }

    function generateQRCode() {
        var qrCodeContainer = document.getElementById('qrCodeContainer');
        var amount = document.querySelector(".input-field.amount").value;
        var firstName = document.querySelector(".input-field.firstname").value;
        var lastName = document.querySelector(".input-field.lastname").value;
        var email = document.querySelector(".input-field.email").value;
        var narration = document.querySelector(".input-field.narration").value;
        // var paymentCompletedButton = document.getElementById("confirm-payment-button");
        document.getElementById("qr-code").innerHTML = "";

        var emailInputField = document.querySelector(".input-field.email");
        if (emailInputField.nextElementSibling.classList.contains("error")) {
            alert('Please enter a valid email address!');
            return;
        }

        if (amount.trim() === '' || email.trim() === '' || lastName.trim() === '' || firstName.trim() === '') {
            alert('Please enter valid details!');
            return;
        }

        togglePageBlur(); // Add the blur effect

        const requestBody = {
            firstName: firstName,
            lastName: lastName,
            amount: amount,
            email: email,
            // description: narration,
        }

        const merchant_key = "QRP-" + new Date().getTime().toString();
        const saveTransactionURL = "https://qr-code-payaza-a13a16038b44.herokuapp.com/api/v1/qr-code/saveTransaction";
        let transaction_reference;
        const maxDuration = 1 * 60 * 1000; // 5 minutes in milliseconds

        fetch(saveTransactionURL, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        })
            .then(response => {
            if (!response.ok) {
                throw new Error(`POST Request failed with status: ${response.status}`);
            }
            return "save transaction response", response.json();
            })
            .then(saveTransactionResponse => {
            transaction_reference = saveTransactionResponse.transactionReference;

            console.log('this is the transaction reference', transaction_reference);
            function fetchData() {
                fetch(`https://qr-code-payaza-a13a16038b44.herokuapp.com/api/v1/qr-code/getTransactionStatusByReference?transactionReference=${transaction_reference}`)
                .then((response) => response.text())
                .then(checkStatus => {
                    if (checkStatus == "Pending") {
                        // Stop calling API after 5 minutes
                        const currentTime = Date.now();
                        if (currentTime - startTime >= maxDuration) {
                            clearInterval(intervalId);
                            location.reload(true);
                            console.log("Stopped calling API after 5 minutes.");
                            // code to redirect to homepage
                        }
                    } else if (checkStatus == "Successful") {
                        // show a success screen and a button to go to homepage
                        console.log("transaction was successful", checkStatus);
                    }
                })
                .catch(error => console.error("Error: ", error)); 
            }
            
            const startTime = Date.now(); // Record the start time
            fetchData();

            // Call fetchData every 5 seconds using setInterval
            const intervalId = setInterval(fetchData, 5000);
        
            const getMerchantReferenceURL = `https://qr-code-payaza-a13a16038b44.herokuapp.com/api/v1/qr-code/getMerchantReference?transactionReference=${transaction_reference}&merchantReference=${merchant_key}`;
        
            return fetch(getMerchantReferenceURL);
            })
            .then(response => {
            if (!response.ok) {
                throw new Error(`GET Request failed with status: ${response.status}`);
            }
            return response;
            })
            .then(response => {
            console.log('GET Response:', response);
            })
            .catch(error => {
            console.error('Error:', error);
        });

        let uri = `https://payaza.africa/payment-page?merchant_key=PZ78-PKLIVE-BCCEB00C-87A4-4F2A-A25B-439315F2EF91&connection_mode=Live&checkout_amount=${amount}&currency_code=NGN&email_address=${email}&first_name=${firstName}&last_name=${lastName}&phone_number=%2B2348150746516&transaction_reference=${merchant_key}`;
        let encoded = encodeURI(uri);

        const qr = new QRCode(document.getElementById("qr-code"), {
            text: "true",
            width: 300,
            height: 300,
        });

        qrCodeContainer.style.display = 'block';
        // paymentCompletedButton.style.display = 'block';
        var transactionStatus = "";

        fetch("https://qr-code-payaza-a13a16038b44.herokuapp.com/api/v1/qr-code/callbackResponse", {
            method: 'POST',
            body: JSON.stringify({}),
        })
        .then(response => response.json())
        .then((responseJson) => {
            transactionStatus = responseJson['transaction_status']
        })
        .then(console.log(transactionStatus))
        .catch(error => console.error("Error: ", error));

        // if (transactionStatus == "Funds Received") {
        //     // display the successful page
        //     qrCodeContainer.innerHTML = '';
        //     const successContainer = document.createElement('div');
        //     successContainer.classList.add('success-container');
        //     successContainer.classList.add('success-image');
        //     const successImage = document.createElement('img');
        //     successImage.src = "successful-withdrawals-128.png";
        //     successImage.alt = "success";
        //     successContainer.appendChild(successImage);
        //     const textSpan = document.createElement('span');
        //     textSpan.classList.add('tick-text');
        //     textSpan.textContent = 'Payment Successful, Transaction Reference: 1234567'; // Text to be displayed
        //     successContainer.appendChild(textSpan);
        //     qrCodeContainer.appendChild(successContainer);
        // }

    }

    function togglePageBlur() {
        const blurElements = document.querySelectorAll('header, .left-side, .right-side, footer');
        blurElements.forEach(element => {
            element.classList.toggle('blur');
        });
    }

    function showImage(imageId) {
        const galleryImage = document.getElementById(imageId);
        galleryImage.style.opacity = 1;
    }
});
