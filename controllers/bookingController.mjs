import Stripe from 'stripe';
import { Booking } from '../models/bookingModel.mjs';
import { Tour } from '../models/tourModel.mjs';
import { User } from '../models/userModel.mjs';
import { AppError } from '../utils/appError.mjs';
import { catchAsync } from '../utils/catchAsync.mjs';
import { createOne, getAll, getOne, updateOne, deleteOne } from '../controllers/handlerFactory.mjs'


//  Initialize stripe with secret key
const getStripeInstance = () => new Stripe(process.env.STRIPE_SECRET_KEY);


const getCheckoutSession = catchAsync(async (req, res, next) => {
    const stripe = getStripeInstance();

    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);
    if (!tour) return next(new AppError("No Tour with this Id!", 400));

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // This is temporary way of creating bookings (we will secure this later with webhooks)
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/my-tour`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        mode: 'payment',

        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`, `https://www.natours.dev/img/tours/${tour.imageCover}`],
                    },
                },
                quantity: 1,
            },
        ],
    });

    // 3) Send session to client
    res.status(200).json({
        status: 'success',
        session,
    });
})

// const createBookingCheckout = catchAsync(async (req, res, next) => {
//     //This is temporary way of creating bookings (we will secure this later with webhooks)
//     const { tour, user, price } = req.query

//     if (!tour && !user && !price) return next();

//     await Booking.create({ tour, user, price });

//     res.redirect(req.originalUrl.split('?')[0])

// })

const createBooking = createOne(Booking);
const getBooking = getOne(Booking);
const getAllBooking = getAll(Booking);
const updateBooking = updateOne(Booking);
const deleteBooking = deleteOne(Booking);


const createBookingCheckout = async (session) => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;
    const price = session.line_items ? session.line_items[0].price_data.unit_amount / 100 : session.amount_total / 100;

    await Booking.create({ tour, user, price });
};
const webhookCheckout = async (req, res, next) => {
    const stripe = getStripeInstance();
    const signature = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        await createBookingCheckout(event.data.object);
    }

    res.status(200).json({ received: true });
}

export {
    getCheckoutSession, createBookingCheckout, createBooking,
    getBooking, getAllBooking, updateBooking, deleteBooking, webhookCheckout
};