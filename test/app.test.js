require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');
const API_TOKEN = process.env.API_TOKEN;

describe('/bookmarks routes', () => {
    let db;
    let testData = [
        {
            'descr': 'description here1',
            'id': '4e8f0287-8968-442e-b589-f28b6c153121',
            'rating': 1,
            'title': 'title1',
            'urls': 'url1'
        },
        {
            'descr': 'description here2',
            'id': '4e8f0287-8968-442e-b589-f28b6c153122',
            'rating': 2,
            'title': 'title2',
            'urls': 'url2'
        },
        {
            'descr': 'description here3',
            'id': '4e8f0287-8968-442e-b589-f28b6c153123',
            'rating': 3,
            'title': 'title3',
            'urls': 'url3'
        }
    ];

    before('setup db', () => {
        db = knex({
            client: 'pg',
            connection: process.env.DB_TEST_URL
        });

        app.set('db', db);
    });

    before(() => db('bookmarks').truncate());

    afterEach(() => db('bookmarks').truncate());

    after(() => db.destroy());

    describe('GET /bookmarks Route', () => {
        it('GET /bookmarks responds with 200 and empty array if no data in bookmarks table', () => {
            return supertest(app)
                .get('/bookmarks')
                .set('Authorization', `Bearer ${API_TOKEN}`)
                .expect(200, []);
        });
        it('GET /bookmarks/:id returns 404 if id doesnt exist', () => {
            return supertest(app)
                .get('/bookmarks/4e8f0287-8968-442e-b589-f28b6c153122')
                .set('Authorization', `Bearer ${API_TOKEN}`)
                .expect('Content-Type', /json/)
                .expect(404, { message: 'ID not found.' });
        });
        it('GET /bookmarks/:id returns 400 if provided invalid UUID', () => {
            return supertest(app)
                .get('/bookmarks/invalid')
                .set('Authorization', `Bearer ${API_TOKEN}`)
                .expect('Content-Type', /json/)
                .expect(400, { message: 'Must provide a valid UUID ex: .../bookmarks/<uuid>' });
        });

        context('bookmarks has data', () => {
            beforeEach(() => {
                return db.into('bookmarks')
                    .insert(testData);
            });
            it('GET /bookmarks returns 200 and array of objects with proper keys when requested', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${API_TOKEN}`)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then(res => {
                        expect(res.body).to.be.an('Array').with.lengthOf(3);
                        expect(res.body[0]).to.be.an('Object');
                        expect(res.body[0]).to.have.all.keys('id', 'urls', 'title', 'descr', 'rating');
                    });
            });
            it('GET /bookmarks/:id returns a specific bookmark when given an id', () => {
                return supertest(app)
                    .get('/bookmarks/4e8f0287-8968-442e-b589-f28b6c153122')
                    .set('Authorization', `Bearer ${API_TOKEN}`)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then(res => {
                        expect(res.body).to.be.an('Object');
                        expect(res.body).to.have.all.keys('id', 'urls', 'title', 'descr', 'rating');
                        expect(res.body.title).to.equal('title2');
                    });
            });
        });
    });


    
    


    // it('POST /bookmarks posts properly given correct info.', () => {
    //     return supertest(app)
    //         .post('/bookmarks')
    //         .set('Authorization', `Bearer ${API_TOKEN}`)
    //         .set('Content-Type', 'application/json')
    //         .send({ title: 'Post test', url: 'http://postTest.com', rating: 5, desc: 'desc post test' })
    //         .expect(201)
    //         .then(res => {
    //             expect(res.body).to.be.an('Object');
    //             expect(res.body).to.have.all.keys('id', 'url', 'title', 'desc', 'rating');
    //             expect(res.headers).to.have.property('location');
    //         });
    // });
    // it('POST /bookmarks posts properly even if desc or rating are not provided.', () => {
    //     return supertest(app)
    //         .post('/bookmarks')
    //         .set('Authorization', `Bearer ${API_TOKEN}`)
    //         .set('Content-Type', 'application/json')
    //         .send({ title: 'Post test', url: 'http://postTest.com' })
    //         .expect(201)
    //         .then(res => {
    //             expect(res.body).to.be.an('Object');
    //             expect(res.body).to.have.all.keys('id', 'url', 'title');
    //             expect(res.headers).to.have.property('location');
    //         });
    // });
    // it('POST /bookmarks returns a 400 error if title is not provided', () => {
    //     return supertest(app)
    //         .post('/bookmarks')
    //         .set('Authorization', `Bearer ${API_TOKEN}`)
    //         .set('Content-Type', 'application/json')
    //         .send({ url: 'http://postTest.com' })
    //         .expect(400, { message: 'Must provide title.' });
    // });
    // it('POST /bookmarks returns a 400 error if url is not provided', () => {
    //     return supertest(app)
    //         .post('/bookmarks')
    //         .set('Authorization', `Bearer ${API_TOKEN}`)
    //         .set('Content-Type', 'application/json')
    //         .send({ title: 'Post test' })
    //         .expect(400, { message: 'Must provide url.' });
    // });


    // it('PATCH /bookmarks/:id returns 200 if sucessfully updated', () => {
    //     return supertest(app)
    //         .patch('/bookmarks/1234')
    //         .set('Authorization', `Bearer ${API_TOKEN}`)
    //         .set('Content-Type', 'application/json')
    //         .send({ rating: 1 })
    //         .expect(200, {});
    // });
    // it('PATCH /bookmarks/:id returns 404 if no such bookmark', () => {
    //     return supertest(app)
    //         .patch('/bookmarks/invalid')
    //         .set('Authorization', `Bearer ${API_TOKEN}`)
    //         .set('Content-Type', 'application/json')
    //         .send({ rating: 1 })
    //         .expect(404, { message: 'No such bookmark exists.' });
    // });
    // it('PATCH /bookmarks/:id returns 400 if not provided any of the 4 editable keys', () => {
    //     return supertest(app)
    //         .patch('/bookmarks/1234')
    //         .set('Authorization', `Bearer ${API_TOKEN}`)
    //         .set('Content-Type', 'application/json')
    //         .expect(400, { message: 'Must provide valid edit key ex: title, url, desc, rating' });
    // });


    // it('DELETE /bookmarks/:id returns 200 if sucessfully deleted', () => {
    //     return supertest(app)
    //         .delete('/bookmarks/1234')
    //         .set('Authorization', `Bearer ${API_TOKEN}`)
    //         .expect(200, {});
    // });
    // it('DELETE /bookmarks/:id returns 404 if no such bookmark', () => {
    //     return supertest(app)
    //         .delete('/bookmarks/invalid')
    //         .set('Authorization', `Bearer ${API_TOKEN}`)
    //         .expect(404, { message: 'No such bookmark exists.' });
    // });
});
