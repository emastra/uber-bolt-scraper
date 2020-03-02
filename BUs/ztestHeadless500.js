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
         'ws://127.0.0.1:41163/devtools/browser/1c6c8f5d-175a-480b-8224-05365de890f2',
        _lastId: 63,
        _callbacks: Map {},
        _delay: 0,
        _transport: [WebSocketTransport],
        _sessions: [Map],
        _closed: false },
     _targetType: 'page',
     _sessionId: '143D48E0FA21E264E69A9B969BFBEA6E' },
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
        _sessionId: '143D48E0FA21E264E69A9B969BFBEA6E' },
     _requestId: '2D17A0CDB6CA18D2A9D7D78F79B797A1',
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
         'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.96 Safari/537.36' },
     _frame:
      Frame {
        _frameManager: [FrameManager],
        _client: [CDPSession],
        _parentFrame: null,
        _url:
         'https://m.uber.com/looking?drop={%22latitude%22:38.70737,%22longitude%22:-9.134625}&pickup={%22latitude%22:38.702553,%22longitude%22:-9.178648}',
        _id: 'B87DD865B7207D32258DA7902E82E1B0',
        _detached: false,
        _loaderId: '2D17A0CDB6CA18D2A9D7D78F79B797A1',
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
  _remoteAddress: { ip: '127.0.0.1', port: 38063 },
  _status: 500,
  _statusText: '',
  _url:
   'https://m.uber.com/looking?drop={%22latitude%22:38.70737,%22longitude%22:-9.134625}&pickup={%22latitude%22:38.702553,%22longitude%22:-9.178648}',
  _fromDiskCache: false,
  _fromServiceWorker: false,
  _headers:
   { status: '500',
     server: 'openresty',
     date: 'Fri, 22 Nov 2019 14:33:48 GMT',
     'content-type': 'text/plain; charset=utf-8',
     'content-length': '21',
     'set-cookie':
      'fsid=587bde7d-hdqr-jvsx-tnqw-u143vxz1aca7; Path=/; Domain=m.uber.com; Expires=Sun, 22 Dec 2019 14:33:48 GMT; HttpOnly; Secure',
     via: '1.1 muttley',
     'strict-transport-security': 'max-age=604800',
     'x-content-type-options': 'nosniff',
     'x-xss-protection': '1; mode=block',
     'x-frame-options': 'SAMEORIGIN',
     'cache-control': 'max-age=0' },
  _securityDetails:
   SecurityDetails {
     _subjectName: '*.uber.com',
     _issuer: 'DigiCert SHA2 Secure Server CA',
     _validFrom: 1499731200,
     _validTo: 1594814400,
     _protocol: 'TLS 1.2' } }
