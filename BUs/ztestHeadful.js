Response {
  _client:
   CDPSession {
     _events:
      [Object: null prototype] {
        'Fetch.requestPaused': [Function: bound _onRequestPaused],
        'Fetch.authRequired': [Function: bound _onAuthRequired],
        'Network.requestWillBeSent': [Function: bound _onRequestWillBeSent],
        'Network.requestServedFromCache': [Function: bound _onRequestServedFromCache],
        'Network.responseReceived': [Function: bound _onResponseReceived],
        'Network.loadingFinished': [Function: bound _onLoadingFinished],
        'Network.loadingFailed': [Function: bound _onLoadingFailed],
        'Page.frameAttached': [Function],
        'Page.frameNavigated': [Function],
        'Page.navigatedWithinDocument': [Function],
        'Page.frameDetached': [Function],
        'Page.frameStoppedLoading': [Function],
        'Runtime.executionContextCreated': [Function],
        'Runtime.executionContextDestroyed': [Function],
        'Runtime.executionContextsCleared': [Function],
        'Page.lifecycleEvent': [Function],
        'Target.attachedToTarget': [Function],
        'Target.detachedFromTarget': [Function],
        'Page.domContentEventFired': [Function],
        'Page.loadEventFired': [Function],
        'Runtime.consoleAPICalled': [Function],
        'Runtime.bindingCalled': [Function],
        'Page.javascriptDialogOpening': [Function],
        'Runtime.exceptionThrown': [Function],
        'Inspector.targetCrashed': [Function],
        'Performance.metrics': [Function],
        'Log.entryAdded': [Function] },
     _eventsCount: 27,
     _maxListeners: undefined,
     _callbacks: Map {},
     _connection:
      Connection {
        _events: [Object],
        _eventsCount: 4,
        _maxListeners: undefined,
        _url:
         'ws://127.0.0.1:38039/devtools/browser/c572fef2-1291-430b-963e-2a859e072e8d',
        _lastId: 64,
        _callbacks: Map {},
        _delay: 0,
        _transport: [WebSocketTransport],
        _sessions: [Map],
        _closed: false },
     _targetType: 'page',
     _sessionId: '9BD9635AAB35FF9CBE268787FE8EA0A6' },
  _request:
   Request {
     _client:
      CDPSession {
        _events: [Object],
        _eventsCount: 27,
        _maxListeners: undefined,
        _callbacks: Map {},
        _connection: [Connection],
        _targetType: 'page',
        _sessionId: '9BD9635AAB35FF9CBE268787FE8EA0A6' },
     _requestId: '9ABAE551CB3E5075953502E55E8BB8A5',
     _isNavigationRequest: true,
     _interceptionId: null,
     _allowInterception: false,
     _interceptionHandled: false,
     _response: [Circular],
     _failureText: null,
     _url:
      'https://m.uber.com/looking?drop={%22latitude%22:38.70737,%22longitude%22:-9.134625}&pickup={%22latitude%22:38.702553,%22longitude%22:-9.178648}',
     _resourceType: 'document',
     _method: 'GET',
     _postData: undefined,
     _headers:
      { 'upgrade-insecure-requests': '1',
        'user-agent':
         'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:65.0) Gecko/20100101 Firefox/65.0' },
     _frame:
      Frame {
        _frameManager: [FrameManager],
        _client: [CDPSession],
        _parentFrame: null,
        _url:
         'https://m.uber.com/looking?drop={%22latitude%22:38.70737,%22longitude%22:-9.134625}&pickup={%22latitude%22:38.702553,%22longitude%22:-9.178648}',
        _id: '0A0C76EC8EE2C1B87421E6899CA173EB',
        _detached: false,
        _loaderId: '9ABAE551CB3E5075953502E55E8BB8A5',
        _lifecycleEvents: [Set],
        _mainWorld: [DOMWorld],
        _secondaryWorld: [DOMWorld],
        _childFrames: Set {},
        _name: undefined,
        _navigationURL:
         'https://m.uber.com/looking?drop={%22latitude%22:38.70737,%22longitude%22:-9.134625}&pickup={%22latitude%22:38.702553,%22longitude%22:-9.178648}' },
     _redirectChain: [],
     _fromMemoryCache: false },
  _contentPromise: null,
  _bodyLoadedPromiseFulfill: [Function],
  _bodyLoadedPromise: Promise { undefined },
  _remoteAddress: { ip: '127.0.0.1', port: 25235 },
  _status: 200,
  _statusText: '',
  _url:
   'https://m.uber.com/looking?drop={%22latitude%22:38.70737,%22longitude%22:-9.134625}&pickup={%22latitude%22:38.702553,%22longitude%22:-9.178648}',
  _fromDiskCache: false,
  _fromServiceWorker: false,
  _headers:
   { status: '200',
     server: 'openresty',
     date: 'Fri, 22 Nov 2019 14:35:07 GMT',
     'content-type': 'text/html; charset=utf-8',
     'set-cookie':
      'fsid=587bde7d-hdqr-jvsx-tnqw-u143vxz1aca7; Path=/; Domain=m.uber.com; Expires=Sun, 22 Dec 2019 14:35:06 GMT; HttpOnly; Secure\njwt-session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1NzQ0MzMzMDcsImV4cCI6MTU3NDUxOTcwN30.ucW-EZ6JlNAhpPoQ7ivRbmOHmMvlsVgBIMq_Xfhukto; path=/; expires=Sat, 23 Nov 2019 14:35:07 GMT; secure; httponly',
     'content-security-policy':
      'block-all-mixed-content; frame-src \'self\' \'self\' http://staticxx.facebook.com https://staticxx.facebook.com https://connect.facebook.net https://connect.facebook.com https://www.facebook.com https://auth.uber.com https://payments.uber.com https://payments-staging.uberinternal.com; worker-src \'self\'; child-src \'self\'; connect-src \'self\' \'self\' https://events.uber.com https://auth.uber.com https://auth.uberinternal.com https://staging.cdn-net.com https://www.cdn-net.com https://www.google-analytics.com https://stats.g.doubleclick.net https://*.cdn-net.com; manifest-src \'self\' \'self\' https://*.cloudfront.net; form-action \'self\'; frame-ancestors \'self\'; object-src \'none\'; script-src \'self\' \'unsafe-inline\' https://d1a3f4spazzrp4.cloudfront.net https://d3i4yxtzktqr9n.cloudfront.net \'nonce-f93d7a91-a5de-48ff-b0eb-3035b01a2ac7\' \'self\' https://tags.tiqcdn.com http://tags.tiqcdn.com http://www.google-analytics.com https://ssl.google-analytics.com https://www.google-analytics.com https://www.googletagmanager.com https://maps.googleapis.com https://connect.facebook.net/ https://connect.facebook.com/ https://staging.cdn-net.com https://*.cdn-net.com https://www.google-analytics.com https://ssl.google-analytics.com maps.googleapis.com maps.google.com; style-src \'self\' \'unsafe-inline\' https://d1a3f4spazzrp4.cloudfront.net https://d3i4yxtzktqr9n.cloudfront.net \'self\' https://d1a3f4spazzrp4.cloudfront.net https://fonts.googleapis.com; img-src \'self\' data: https://*.uber.com https://*.cloudfront.net https://s3.amazonaws.com https://www.google-analytics.com https://maps.googleapis.com https://csi.gstatic.com https://maps.gstatic.com https://play.google.com https://assets.windowsphone.com https://www.facebook.com https://web.facebook.com https://www.google.com https://www.google.co.in https://rtd-tm.everesttech.net; report-uri https://csp.uber.com/csp?a=hulk&ro=false',
     via: '1.1 muttley',
     'x-frame-options': 'SAMEORIGIN',
     'x-xss-protection': '1; mode=block',
     'strict-transport-security': 'max-age=604800',
     'x-content-type-options': 'nosniff',
     'cache-control': 'max-age=0',
     'content-encoding': 'gzip' },
  _securityDetails:
   SecurityDetails {
     _subjectName: '*.uber.com',
     _issuer: 'DigiCert SHA2 Secure Server CA',
     _validFrom: 1499731200,
     _validTo: 1594814400,
     _protocol: 'TLS 1.2' } }
