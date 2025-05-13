const mongoose = require('mongoose');

class BaseModel {
    constructor(schema) {
        this.schema = schema;
        this.model = mongoose.model(this.constructor.name, schema);
    }

    async findById(id) {
        return this.model.findById(id);
    }

    async findOne(query) {
        return this.model.findOne(query);
    }

    async find(query = {}) {
        return this.model.find(query);
    }

    async create(data) {
        const instance = new this.model(data);
        return instance.save();
    }

    async update(id, data) {
        return this.model.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return this.model.findByIdAndDelete(id);
    }
}

module.exports = BaseModel; 