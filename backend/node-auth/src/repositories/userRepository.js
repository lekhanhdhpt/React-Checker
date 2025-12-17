import User from '../models/User.js';

const create = (data) => User.create(data);
const findByEmail = (email) => User.findOne({ email });
const findById = (id) => User.findById(id);

export default { create, findByEmail, findById };
