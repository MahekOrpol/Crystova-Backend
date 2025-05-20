const httpStatus = require('http-status');
const Joi = require('joi');
const { saveFile } = require('../utils/helper');
const Blogs = require('../models/blogs.model');

const createBlogs = {
    validation: {
        body: Joi.object().keys({
            headline: Joi.string().required(),
            sentence: Joi.string().required(),
            description: Joi.string().required(),
            articleBody: Joi.string().required(),
            authorName: Joi.string().required(),
            imges: Joi.string().optional().allow(null),
            trend: Joi.alternatives().try(
                Joi.array().items(Joi.string()),
                Joi.string()
            ).required(),
            tag: Joi.alternatives().try(
                Joi.array().items(Joi.string()),
                Joi.string()
            ).required()
        }),
    },
    handler: async (req, res) => {
        try {
            const {
                headline,
                sentence,
                description,
                articleBody,
                authorName,
                trend,
                tag
            } = req.body;

            // Process arrays (trend and tag)
            const processArrayField = (field) => {
                if (Array.isArray(field)) return field;
                try {
                    return JSON.parse(field);
                } catch {
                    throw new Error(`Invalid format for ${field}. Must be array or JSON string`);
                }
            };

            let processedTrend, processedTag;
            try {
                processedTrend = processArrayField(trend);
                processedTag = processArrayField(tag);
            } catch (error) {
                return res.status(httpStatus.BAD_REQUEST).send({
                    code: 400,
                    message: error.message
                });
            }

            // Handle file upload
            // let imagePath = null;

            if (req.file) {
                console.log('Uploaded file:', req.file); // Debug log
                try {
                    const uploadedFile = await saveFile(req.file);
                    console.log('req.file :>> ', req.file);
                    imagePath = uploadedFile?.upload_path;
                } catch (fileError) {
                    console.error('File upload error:', fileError);
                    // Continue without failing the whole request
                }
            } else {
                console.log('No file was uploaded'); // Debug log
            }

            // Create blog
            const blog = new Blogs({
                headline,
                sentence,
                description,
                articleBody,
                authorName,
                trend: processedTrend,
                tag: processedTag,
                imges: imagePath
            });

            await blog.save();

            return res.status(httpStatus.CREATED).send({
                success: true,
                data: blog,
                message: 'Blog created successfully'
            });

        } catch (error) {
            console.error('Error creating blog:', error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
                code: 500,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

const updateBlogs = {
    validation: {
        body: Joi.object().keys({
            headline: Joi.string(),
            sentence: Joi.string(),
            description: Joi.string(),
            articleBody: Joi.string(),
            authorName: Joi.string(),
            imges: Joi.string(),
            trend: Joi.array().items(Joi.string()),  // Ensure this is an array
            tag: Joi.array().items(Joi.string())
        }),
    },
    handler: async (req, res) => {
        const aboutUs = await Blogs.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
        return res.send(aboutUs);
    }
};

const deleteBlogs = {
    handler: async (req, res) => {
        const aboutUs = await Blogs.findByIdAndDelete({ _id: req.params.id });
        return res.status(httpStatus.OK).send(aboutUs);
    }
};

const getBlogs = {
    handler: async (req, res) => {

        const aboutUs = await Blogs.find();
        return res.status(httpStatus.OK).send(aboutUs);
    }
};
const getBlogById = {
    handler: async (req, res) => {
        try {
            const blog = await Blogs.findById(req.params.id);
            if (!blog) {
                return res.status(httpStatus.NOT_FOUND).send({ message: 'Blog not found' });
            }
            return res.status(httpStatus.OK).send(blog);
        } catch (error) {
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'Invalid blog ID', error: error.message });
        }
    }
};

module.exports = {
    createBlogs,
    updateBlogs,
    deleteBlogs,
    getBlogs,
    getBlogById
};