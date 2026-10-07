import User from './User.js';
import Event from './Event.js';
import Venue from './Venue.js';
import Seat from './Seat.js';
import EventSeat from "./EventSeat.js";
import Booking from "./Booking.js";
import BookingItem from "./BookingItem.js";
import Payment from "./Payment.js";

Venue.hasMany(Event, {
    foreignKey: 'venue_id',
});
Event.belongsTo(Venue, {
    foreignKey: 'venue_id',
});
Venue.hasMany(Seat, {
    foreignKey: 'venue_id',
});
Seat.belongsTo(Venue, {
    foreignKey: 'venue_id',
});
Event.hasMany(EventSeat, {
    foreignKey: "event_id",
});

EventSeat.belongsTo(Event, {
    foreignKey: "event_id",
});

Seat.hasMany(EventSeat, {
    foreignKey: "seat_id",
});

EventSeat.belongsTo(Seat, {
    foreignKey: "seat_id",
});
User.hasMany(Booking, {
    foreignKey: "user_id",
});

Booking.belongsTo(User, {
    foreignKey: "user_id",
});

Event.hasMany(Booking, {
    foreignKey: "event_id",
});

Booking.belongsTo(Event, {
    foreignKey: "event_id",
});

Booking.hasMany(BookingItem, {
    foreignKey: "booking_id",
});

BookingItem.belongsTo(Booking, {
    foreignKey: "booking_id",
});

EventSeat.hasMany(BookingItem, {
    foreignKey: "event_seat_id",
});

BookingItem.belongsTo(EventSeat, {
    foreignKey: "event_seat_id",
});
Booking.hasMany(Payment, {
    foreignKey: "booking_id",
});

Payment.belongsTo(Booking, {
    foreignKey: "booking_id",
});