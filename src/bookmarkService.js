const bookmarkService = {
    getAllBookmarks(db) {
        return db.select('*').from('bookmarks');
    },
    getBookmarkById(db, id) {
        return db.from('bookmarks')
            .select('*')
            .where({id})
            .first();
    }
};

module.exports = bookmarkService;