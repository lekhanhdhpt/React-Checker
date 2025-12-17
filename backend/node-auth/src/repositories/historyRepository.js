import History from '../models/History.js';

const create = (data) => History.create(data);
const findByUser = (userId) => History.find({ user: userId }).sort({ createdAt: -1 }).populate('report');
const findByIdAndUser = (id, userId) => History.findOne({ _id: id, user: userId }).populate('report');

export default { create, findByUser, findByIdAndUser };
