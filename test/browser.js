/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const WSlibp2p = require('libp2p-websockets')
const multiaddr = require('multiaddr')
const collect = require('pull-stream/sinks/collect')
const values = require('pull-stream/sources/values')
const empty = require('pull-stream/sources/empty')
const onEnd = require('pull-stream/sinks/on-end')
const pull = require('pull-stream/pull')

const multiplex = require('../src')

describe('browser-server', () => {
  let ws

  before(() => {
    ws = new WSlibp2p()
  })

  it('ricochet test', (done) => {
    const mh = multiaddr('/ip4/127.0.0.1/tcp/9095/ws')
    const transportSocket = ws.dial(mh)
    const muxedConn = multiplex.dialer(transportSocket)

    muxedConn.on('stream', (conn) => {
      pull(
        conn,
        collect((err, chunks) => {
          expect(err).to.not.exist()
          expect(chunks).to.be.eql([Buffer.from('hey')])
          pull(empty(), conn)
        })
      )
    })

    pull(
      values([Buffer.from('hey')]),
      muxedConn.newStream(),
      onEnd(done)
    )
  })
})
