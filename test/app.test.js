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
                .expect(400, { message: 'Must provide a valid ID to get' });
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


    describe('POST /bookmarks route', () => {
        it('POST /bookmarks posts properly given correct info. (FULL INTEGRATION TEST)', () => {
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${API_TOKEN}`)
                .set('Content-Type', 'application/json')
                .send({ title: 'Post test', urls: 'http://postTest.com', rating: 5, descr: 'desc post test' })
                .expect(201)
                .then(res => {
                    expect(res.body).to.be.an('Object');
                    expect(res.body).to.have.all.keys('id', 'urls', 'title', 'descr', 'rating');
                    expect(res.headers).to.have.property('location');

                    let dataBaseConfirmation = db.select('*').from('bookmarks').where('id', res.body.id).first();
                    dataBaseConfirmation.then(resp => {
                        expect(resp).to.eql({ id: res.body.id, title: 'Post test', urls: 'http://postTest.com', rating: 5, descr: 'desc post test' });
                    });
                });
        });
        it('POST /bookmarks posts properly even if descr is not provided.', () => {
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${API_TOKEN}`)
                .set('Content-Type', 'application/json')
                .send({ title: 'Post test', urls: 'http://postTest.com', rating: 4 })
                .expect(201)
                .then(res => {
                    expect(res.body).to.be.an('Object');
                    expect(res.body).to.have.all.keys('id', 'urls', 'title', 'descr', 'rating');
                    expect(res.headers).to.have.property('location');
                });
        });
        it('POST /bookmarks returns a 400 error if title is not provided', () => {
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${API_TOKEN}`)
                .set('Content-Type', 'application/json')
                .send({ url: 'http://postTest.com', rating: 5 })
                .expect(400, { message: 'Must provide title.' });
        });
        it('POST /bookmarks returns a 400 error if url is not provided', () => {
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${API_TOKEN}`)
                .set('Content-Type', 'application/json')
                .send({ title: 'Post test', rating: 5 })
                .expect(400, { message: 'Must provide url.' });
        });
        it('POST /bookmarks returns a 400 error if rating is not provided', () => {
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${API_TOKEN}`)
                .set('Content-Type', 'application/json')
                .send({ title: 'Post test', urls: 'http://postTest.com' })
                .expect(400, { message: 'Must provide rating.' });
        });
    });


    describe('DELETE /bookmarks/:id route', () => {
        it('returns 400 if invalid id provided', () => {
            return supertest(app)
                .delete('/bookmarks/invalid')
                .set('Authorization', `Bearer ${API_TOKEN}`)
                .expect(400, { message: 'Must provide a valid ID to delete.' });
        });
        context('bookmarks has info', () => {
            beforeEach(() => {
                return db.into('bookmarks')
                    .insert(testData);
            });
            it('DELETE /bookmarks/:id returns 204 if sucessfully deleted (FULL INTEGRATION TEST)', () => {
                return supertest(app)
                    .delete('/bookmarks/4e8f0287-8968-442e-b589-f28b6c153121')
                    .set('Authorization', `Bearer ${API_TOKEN}`)
                    .expect(204)
                    .then(() => {

                        //checking to see if it actually was deleted.
                        let dataBaseConfirmation = db.select('*').from('bookmarks').where('id', '4e8f0287-8968-442e-b589-f28b6c153121');
                        dataBaseConfirmation.then(resp => {
                            expect(resp).to.eql([]);
                        });
                    });
            });
            it('returns 404 if no such bookmark', () => {
                return supertest(app)
                    .delete('/bookmarks/4e8f0287-8968-442e-b589-f28b6c159999')
                    .set('Authorization', `Bearer ${API_TOKEN}`)
                    .expect(404, { message: 'No such bookmark exists.' });
            });
        });
    });




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



});
