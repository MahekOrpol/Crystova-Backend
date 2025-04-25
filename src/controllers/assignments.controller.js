const Joi = require("joi");
const { Assignments, DiscussionRoom, Admin, Notification } = require("../models");
const httpStatus = require("http-status");
var ObjectID = require('mongodb').ObjectID;
var objectId = new ObjectID();



const createAssignments = {
    validation: {
        body: Joi.object().keys({
            title: Joi.string().required(),
            status: Joi.string().required(),
            members: Joi.array().required(),
            assignmentSummary: Joi.string().required(),
            startDate: Joi.string().required(),
            endDate: Joi.string().required(),
            projectDescription: Joi.string(),
        })
    },
    handler: async (req, res) => {
        const userData = await Assignments.findOne({ title: req.body.title })

        // if (userData) {
        //     return res.status(httpStatus.BAD_REQUEST).send({
        //         message: 'assignments already exists',
        //     });
        // }
        const body = {
            ...req.body,
            createdBy: req.user._id,
            members: [...req.body.members, req.user._id],
        }

        //send notification 
        const creationPayload = {
            title: "New Assignment Created 📝",
            description: "A new assignment has been created. Please review it.",
            createdBy: req.user._id,
        }
        await new Notification(creationPayload).save();

        const assignments = await new Assignments(body).save();

        await new DiscussionRoom({
            createdBy: req.user._id,
            assignmentId: assignments?._id,
            members: [...req.body.members, req.user._id]
        }).save();

        return res.status(httpStatus.CREATED).send(assignments);
    }
}

const updateAssignments = {
    validation: {
        body: Joi.object().keys({
            title: Joi.string(),
            status: Joi.string(),
            members: Joi.array(),
            assignmentSummary: Joi.string(),
            startDate: Joi.string(),
            endDate: Joi.string(),
            projectDescription: Joi.string(),
        }),
    },
    handler: async (req, res) => {
        const assignment = await Assignments.findOne({ _id: req.params.id })
        if (!assignment) {
            return res.status(httpStatus.BAD_REQUEST).send({
                message: 'Assignment Not Found',
            });
        }

        await Assignments.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true });

        if (req.body.status === "Finished") {
            const completionPayload = {
                title: "Assignment Completed 😇",
                description: "The assignment has been completed. Please review it and provide feedback.",
                createdBy: req.user._id,
            }
            await new Notification(completionPayload).save();
        }


        return res.status(httpStatus.OK).send({ message: "assignments update successfully" });
    }
};

const deleteAssignments = {
    handler: async (req, res) => {
        await Assignments.findByIdAndDelete({ _id: req.params.id });
        return res.status(httpStatus.OK).send({
            message: "assignments delete successfully"
        });
    }
};

const getAssignments = {
    handler: async (req, res) => {
        // const page = parseInt(req.query.page || 1);
        // const limit = parseInt(req.query.limit || 10);
        // const skipValue = limit * page - limit;

        if (req?.user?.role === "Admin") {
            const Assignment = await Assignments.find({ ...(req.query?.title && { title: req.query?.title }) }).populate("members");
            return res.status(httpStatus.OK).send(Assignment);
        }

        const assignment = await Assignments.find({
            ...(req.query?.title && { title: req.query?.title }),
            members: {
                $in: req?.user?.id
            }
        }).populate("members")
        // .limit(limit).skip(skipValue);
        return res.status(httpStatus.OK).send(assignment);

    }
}

const getAssignmentsStatus = {
    handler: async (req, res) => {
        // const { status } = req.query;
        // const filter = {};

        // if (status) {
        //     filter.status = status;
        // }

        const assignments = await Assignments.find({
            members: {
                $in: req?.user?.id
            }, status: req?.query?.status
        }).populate("members");
        return res.status(httpStatus.OK).send(assignments);
    }
}



const getUser = {
    handler: async (req, res) => {
        const user = await Admin.find({ year: req.user.year, role: "User" })
        return res.status(httpStatus.OK).send(user);
    }
}

module.exports = {
    createAssignments,
    updateAssignments,
    deleteAssignments,
    getAssignments,
    getUser,
    getAssignmentsStatus
}