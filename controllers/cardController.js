const { cardModel } = require("../models/card");

const addCard = async (req, res) => {
    try {

        const {
            name, cradNo, expMonth, expYear, cvv
        } = req.body
        if (!(name && cradNo && expMonth && expYear && cvv)) {
            return res
                .status(400)
                .send({ status: 0, message: "All fields are necessary" });
        }
        const card = await new cardModel({
            user_id: req.user._id, ...req.body
        }).save()

        return res.status(200).send({
            status: 1,
            message: "Card Added Successfully",
            data: card,
        });

    } catch (err) {
        return res.status(400).send({ status: 0, message: e.message });

    }
}

const getCard = async (req, res) => {
    try {
        const data = await cardModel.find({ user_id: req.user._id })
        if (data.length > 0) {
            return res.status(200).send({
                status: 1,
                message: "your Cards get successfully",
                data,
            });
        } else {
            return res.status(200).send({
                status: 0,
                message: "You have no any card added",

            });
        }

    } catch (err) {
        return res.status(400).send({ status: 0, message: e.message });

    }
}

const updateCard = async (req, res) => {
    try {
        const { id } = req.params

        const data = await cardModel.findOne({ _id: id,user_id:req.user._id })
        if (!data) {
            return res.status(200).send({
                status: 0,
                message: "Inavlid id",

            });
        } else {
            const updatedData = await cardModel.findByIdAndUpdate(id, req.body, { new: true })
            return res.status(200).send({
                status: 1,
                message: "Card Info updated successfully",
                data: updatedData

            });
        }
    } catch (err) {
        return res.status(400).send({ status: 0, message: e.message });

    }
}

const deleteCard = async (req, res) => {
    try {

        const { id } = req.params
        const data = await cardModel.findOne({ _id: id,user_id:req.user._id })
        if (!data) {
            return res.status(200).send({
                status: 0,
                message: "Inavlid id",

            });
        } else {
            const updatedData = await cardModel.findByIdAndDelete(id)
            return res.status(200).send({
                status: 1,
                message: "Card deleted successfully",
                data: updatedData

            });
        }
    } catch (err) {
        return res.status(400).send({ status: 0, message: e.message });

    }
}

module.exports = { addCard, getCard, updateCard, deleteCard }
