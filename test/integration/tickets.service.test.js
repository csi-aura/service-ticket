/*
 #  Project: chaise                                                            #
 #  File: \tests\unit_test.js                                                  #
 #                                                                             #
 #  Author: Sylvain (contact@cashsystemes.eu)                                  #
 #  Modified By: Sylvain (contact@cashsystemes.eu>)                            #
 #                                                                             #
 #  File Created: Monday, 24th June 2019 10:45:20 am                           #
 #  Last Modified: Friday, 12th July 2019 12:03:12 pm                          #
 #                                                                             #
 #  Copyright 2018 - 2019, Cash Systemes Industries                            #
 */

 const chai = require('chai');
 const chaiHttp = require('chai-http');
 const should = chai.should();
 chai.use(chaiHttp);
 
 // console.log(process.env)
 
 let server
 
 try {
     // REGEX for ip in string
     let r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/
     let app_name = process.env.APP_NAME || 'chaise'
     let app_ingress_ip = process.env.HUDSON_URL.match(r)[0] || '192.168.30.244';
     let app_env = process.env.KUBE_ENVIRONMENT || 'jx-staging'
     server = `http://${app_name}.${app_env}.${app_ingress_ip}.nip.io`
 
 } catch (error) {
     server = `http://localhost:3000`
 }
 
 
 
 
 
 /*
  * Test the API
  */
 describe('TEST DU SERVICE ticket', () => {
     let _id = null
     let book = {
         nom: "Sylvain",
         prenom: "Pip"
     }
 
 
 
 
     it('Ajout d\'un ticket', done => {
 
         chai.request(server)
             .post('/api/tickets')
             .send(book)
             .end((err, res) => {
                 res.should.have.status(200);
                 res.body.should.be.a('object');
                 res.body.should.have.property('nom').eql(book.nom);
                 res.body.should.have.property('prenom').eql(book.prenom);
                 res.body.should.have.property('_id').to.be.a('string');
                 _id = res.body._id
                 done();
             });
     });
 
 
 
 
     it('Liste de tout les tickets', done => {
         chai.request(server)
             .get('/api/tickets')
             .end((err, res) => {
                 res.should.have.status(200);
                 res.body.should.be.a('object');
                 res.body.should.have.property('rows').to.be.a('array');
                 res.body.should.have.property('total').to.be.a('number');
                 res.body.should.have.property('page').to.be.a('number');
                 res.body.should.have.property('pageSize').to.be.a('number');
                 res.body.should.have.property('totalPages').to.be.a('number');
                 done();
             });
     });
 
 
 
 
     it('Recherche du ticket', done => {
         chai.request(server)
             .get('/api/tickets/' + _id)
             .end((err, res) => {
                 res.should.have.status(200);
                 res.body.should.be.a('object');
                 res.body.should.have.property('nom').eql(book.nom);
                 res.body.should.have.property('prenom').eql(book.prenom);
                 res.body.should.have.property('_id').eql(_id)
                 done();
             });
     });
 
 
 
     it('Suppression du ticket', done => {
         chai.request(server)
             .delete('/api/tickets/' + _id)
             .end((err, res) => {
                 res.should.have.status(200);
                 res.body.should.be.a('object');
                 res.body.should.have.property('nom').eql(book.nom);
                 res.body.should.have.property('prenom').eql(book.prenom);
                 res.body.should.have.property('_id').eql(_id)
                 done();
             });
     });
 
 
 
 
 
 
 });