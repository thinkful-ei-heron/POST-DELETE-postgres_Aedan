const express = require('express');
const bookmarkService = require('./bookmarkService');
const uuid = require('uuid/v4');
const logger = require('./logger');
const xss = require('xss');

const bookmarksRouter = express.Router();

bookmarksRouter.get('/bookmarks', (req, res, next) => {
    let db = req.app.get('db');
    bookmarkService.getAllBookmarks(db)
        .then(resp => {
            if(resp.length > 0) {
                //goes through and sanitizes each value for key:value pairs.
                resp.forEach(obj => {
                    Object.keys(obj).forEach(key => {
                        obj[key] = xss(obj[key]);
                    });
                });
            }
            return res.status(200).json(resp);
        })
        .catch(next);
});

bookmarksRouter.get('/bookmarks/:id', (req, res, next) => {
    let db = req.app.get('db');
    let id = req.params.id;

    //checks to see if id provided is a valid UUID
    if(!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        logger.error('Must provide valid UUID');
        return res.status(400).json({message: 'Must provide a valid ID to get'});
    }

    bookmarkService.getBookmarkById(db, id)
        .then(resp => {
            if(resp) {
                let json ={}; 
                //goes through and sanitizes each value for key:value pairs.
                Object.keys(resp).forEach(key => {
                    json[key] = xss(resp[key]);
                });
                return res.json(json);
            } else {
                logger.error(`Bookmark with ID ${req.params.id} not found`);
                return res.status(404).json({message: 'ID not found.'});
            }
        })
        .catch(next);
});

bookmarksRouter.post('/bookmarks', (req, res, next) => {
    let {title, urls, descr, rating} = req.body;
    if(!title) {
        logger.error('Must provide title.');
        return res.status(400).json({message: 'Must provide title.'});
    }
    if(!urls) {
        logger.error('Must provide url.');
        return res.status(400).json({message: 'Must provide url.'});
    }
    if(!rating) {
        logger.error('Must provide rating.');
        return res.status(400).json({message: 'Must provide rating.'});
    }
    let id = uuid();
    let keyArray = ['id', 'title', 'urls', 'descr', 'rating'];
    let valueArray = [id, title, urls, descr, rating];
    let post = {};

    //checks to see if value was provided for any fields for the bookmark and assigns the key/value pairs for them.
    for(let i = 0; i < valueArray.length;i++) {
        if(valueArray[i]) {
            post[keyArray[i]] = xss(valueArray[i]);
        }
    }
   
    let db = req.app.get('db');
    bookmarkService.postBookmark(db, post)
        .then(resp => {
            return res.status(201).location(`http://localhost:8000/bookmarks/${id}`).json(resp);
        })
        .catch(next);
});

// bookmarksRouter.patch('/bookmarks/:id',(req,res) => {
//     let {id} = req.params;
//     let edit = dataStore.find(item => item.id === id);
//     if(!edit) {
//         logger.error(`Bookmark with ID ${id} not found`);
//         return res.status(404).json({message: 'No such bookmark exists.'});
//     }
//     let {title, url, desc, rating} = req.body;
//     let keyArray = ['title', 'url', 'desc', 'rating'];
//     let valueArray = [title, url, desc, rating];
//     if(!title && !url && !desc && !rating) {
//         logger.error('Must provide valid edit key.');
//         return res.status(400).json({message: `Must provide valid edit key ex: ${keyArray.join(', ')}`});
//     }
//     for(let i = 0; i < valueArray.length; i++) {
//         if(valueArray[i]) {
//             edit[keyArray[i]] = valueArray[i];
//         }
//     }

//     return res.status(200).json({});
// });

bookmarksRouter.delete('/bookmarks/:id',(req,res, next)=>{
    let {id} = req.params;
    //checks if id is a valid UUID
    if(!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        logger.error('Must provide valid UUID');
        return res.status(400).json({message: 'Must provide a valid ID to delete.'});
    }

    let db = req.app.get('db');
    bookmarkService.deleteBookmark(db, xss(id))
        .then(resp => {
            if(resp) {
                return res.status(204).end();
            }
            else {
                logger.error('Bookmark not found');
                return res.status(404).json({message: 'No such bookmark exists.'});
            }
        })
        .catch(next);
});

module.exports = bookmarksRouter;