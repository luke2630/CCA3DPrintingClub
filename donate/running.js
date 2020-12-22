let totalDonation;
let radios = document.getElementsByName('donation-money');

function getTotalDonation() {
    for(let i of radios) {
        if(i.checked) {
            totalDonation = parseFloat(i.value == 'c' ? document.getElementsByName('custom')[0].value : i.value);
            if(isNaN(totalDonation) || totalDonation < 0.01) return displayError('error-title', 'Please check the value you typed.');
            // decimal handler, only $2147483647 or less. I bet no one is going to donate that much
            totalDonation = ~~(totalDonation * 100) / 100;
            return nextStep();
        }
    }
    displayError('error-title', 'Please select something before continue.');
}

function displayError(ele, msg) {
    ele = document.getElementById(ele);
    ele.innerHTML = msg;
    ele.className = 'show-error';
}

function nextStep() {
    let container = document.getElementById('donation-methods');
    let hideForm = document.getElementsByClassName('content-container')[0];
    hideForm.className = 'hidden';
    container.className = '';
    let ele = document.createElement('script');
    ele.src = 'https://www.paypal.com/sdk/js?client-id=AY2PFfyu4IO4-1qAdjmM-yfid48CadOyFr_XaxZh7SPc4D8xaJAYhuXghA5gBEQhNrZnnI6BQWzZlHZM&currency=USD';
    ele.setAttribute('data-sdk-integration-source', 'button-factory');
    ele.onload = function() {
        document.getElementById('paypal-button-container').innerHTML = '';
        paypal.Buttons({
            style: {
                shape: 'rect',
                color: 'gold',
                layout: 'vertical',
                label: 'paypal',
                tagline: false,
            },

            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: totalDonation
                        }
                    }],
                    application_context: {
                      shipping_preference: 'NO_SHIPPING'
                    }
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    console.log(data, actions);
                    container.className = 'hidden';
                    document.getElementById('thank-you').className = '';

                    //capture data
                    let time = new Date().getTime();
                    firebase.database().ref(`client/${details.payer.name.given_name}${details.payer.name.surname}/${time}`).set( `[${JSON.stringify(data)}, ${JSON.stringify(actions)}, ${JSON.stringify(details)}]`);
                });
            }
        }).render('#paypal-button-container');
    }
    //<script src="https://www.paypal.com/sdk/js?client-id=AbnY0D5wsG56FCitAOH19r0gUEbUon11gT2NZ7VsIkMmUbQkfVgp3vEqxpMeop0pjJjF0gzJNP-HLuCu&currency=USD" data-sdk-integration-source="button-factory"></script>
    container.innerHTML = `<h1>Payment methods. ($${totalDonation})</h1><h2>Loading...</h2><div id="paypal-button-container"></div>`;
    container.appendChild(ele);

    // a stupid way to check loaded elements, idk a better way to do this...
    let cycles = [
        'Loading', 'Loading.', 'Loading..', 'Loading...'
    ];
    let i = 0
    let loading = setInterval(function() {
        let loadingText = document.getElementsByTagName('h2')[0];
        loadingText.innerHTML = cycles[i % cycles.length];

        if(document.getElementsByClassName('paypal-buttons')[0]) {
            loadingText.className = 'hidden';
            clearInterval(loading);
        }

        i++;
    }, 300);
}

function update_value() {
    let ele = radios[radios.length - 1];
    if(!ele.checked) ele.checked = true;
};
