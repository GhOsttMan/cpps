const express = require('express');
const ProblemList = require('mongoose').model('ProblemList');

const router = express.Router();

router.get('/problemlists', getProblemLists);
router.get('/problemlists/:problemListId', getSingleProblemList);

router.post('/problemlists', insertProblemList);
router.put('/problemlists/:problemListId/add-problem', addProblemToList);

module.exports = {
  addRouter(app) {
    app.use('/api/v1', router);
  },
};

async function getProblemLists(req, res, next) {
  try {
    const {userId, username} = req.session;
    const {createdBy} = req.query;

    if (userId !== createdBy) {
      return next({
        status: 401,
        message: `You ${username}:${userId} cannot view list of ${createdBy}`,
      });
    }

    const problemLists = await ProblemList.find({createdBy}).exec();
    return res.status(200).json({
      status: 200,
      data: problemLists,
    });
  } catch (err) {
    return next(err);
  }
}

async function insertProblemList(req, res, next) {
  try {
    const {userId} = req.session;
    const {title} = req.body;

    const problemList = new ProblemList({
      title,
      createdBy: userId,
      problems: [],
    });

    await problemList.save();
    return res.status(201).json({
      status: 201,
      data: problemList,
    });
  } catch (err) {
    return next(err);
  }
}

async function getSingleProblemList(req, res, next) {
  try {
    const {problemListId} = req.params;

    if (!problemListId) {
      return next({
        status: 401,
        message: `ProblemListId cannot be blank`,
      });
    }

    const problemList = await ProblemList.findOne({_id: problemListId}).exec();

    if (problemList.createdBy.toString() !== req.session.userId) {
      return next({
        status: 401,
        message: `You do not have permission to view this list. Reason - You did not create this list.`,
      });
    }

    return res.status(200).json({
      status: 200,
      data: problemList,
    });
  } catch (err) {
    return next(err);
  }
}

async function addProblemToList(req, res, next) {
  try {
    const {problemListId} = req.params;
    const {title, platform, problemId, link} = req.body;

    console.log(platform);

    if (!problemListId || !title || !platform || !problemId || !link) {
      return next({
        status: 401,
        message: `Some parameters are blank`,
      });
    }

    const updatedList = await ProblemList.findOneAndUpdate({
      _id: problemListId,
      createdBy: req.session.userId,
    }, {
      $push: {
        problems: {
          title,
          platform,
          problemId,
          link,
        },
      },
    }, {
      new: true,
    });

    if (!updatedList) {
      return next({
        status: 401,
        message: `Problem List not found`,
      });
    }

    return res.status(201).json({
      status: 201,
      data: updatedList.problems[updatedList.problems.length-1],
    });
  } catch (err) {
    return next(err);
  }
}