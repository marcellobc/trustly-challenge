const router = require('express').Router();

const RepositoryController = require('../app/controllers/RepositoryController');

router.get('/:username/:repository', RepositoryController.show);

module.exports = router;
