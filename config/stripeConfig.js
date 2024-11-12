
const stripe = require('stripe')(process.env.STRIPE_KEY);

const paymentIdVerification = (paymentId) => {
    try{

        stripe.paymentIntents.retrieve(paymentId)
        .then(paymentIntent => {
            if (paymentIntent.status === 'succeeded') {
                return true
            } else {
                return false 
            }
        })
        .catch(error => {
            console.error('Error retrieving payment:', error);
            return false
        });
    }
    catch (err) {
        return err;
    }
}

module.exports = { paymentIdVerification }
