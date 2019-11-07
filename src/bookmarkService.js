const bookmarkService = {
    getAllBookmarks(db) {
        return db.select('*').from('bookmarks');
    },
    getBookmarkById(db, id) {
        return db.from('bookmarks')
            .select('*')
            .where({id})
            .first();
    },
    postBookmark(db, post) {
        return db.into('bookmarks')
            .insert(post)
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },
    deleteBookmark(db, id) {
        return db.from('bookmarks')
            .where({id})
            .delete();
    },
};

module.exports = bookmarkService;