import Report from '../models/Report.js';

const create = (data) => Report.create(data);
const findByHistory = (historyId) => Report.findOne({ history: historyId });

export default { create, findByHistory };
