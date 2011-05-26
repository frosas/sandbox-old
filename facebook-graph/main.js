(function() {

    var Graph = function(canvas) {

        $(canvas).attr({
            width: $(window).width(),
            height: $(window).height()
        })

        var sys = arbor.ParticleSystem(20, 100, 0.7, true);

        sys.renderer = (function() {

            var context = canvas.getContext('2d')
            var sys

            var clear = function() {
                context.fillStyle = 'white'
                context.fillRect(0, 0, canvas.width, canvas.height)
            }

            return {

                init: function(_sys) {
                    sys = _sys
                    sys.screenSize(canvas.width, canvas.height)
                },

                redraw: function() {

                    clear()

                    context.strokeStyle = 'rgba(0, 0, 0, 0.03)'
                    context.lineWidth = 1
                    sys.eachEdge(function(edge, source, target) {
                        context.beginPath()
                        context.moveTo(source.x, source.y)
                        context.lineTo(target.x, target.y)
                        context.stroke()
                    })

                    sys.eachNode(function(node, point) {
                        var data = nodesData[node.name]
                        if (data && data.pictureUrl) {
                            var image = $('<img>').attr({ src: data.pictureUrl }).get(0)
                            context.globalAlpha = 0.8
                            context.drawImage(image, point.x - image.width / 2, point.y - image.height / 2)
                        }
                    })
                }
            }
        })()

        return {
            sys: sys
        }
    }

    var nodesData = {}

    $(function() {

        var initFacebookLogin = function() {

            var update = function() {
                FB.getLoginStatus(function(response) {
                    if (response.session) {
                        $('a.login').hide()
                        $('a.logout').show()
                    } else {
                        $('a.login').show()
                        $('a.logout').hide()
                    }
                })
            }

            $(function() {

                $('a.login').click(function() {
                    FB.login()
                    return false
                })

                $('a.logout').click(function() {
                    FB.logout()
                    return false
                })

                FB.Event.subscribe('auth.statusChange', function(response) {
                    update()
                })

                update()
            })
        }

        var initFacebook = function() {
            FB.init({ appId: '151058681629033', cookie: true })
            initFacebookLogin()
        }

        var initGraph = function() {

            var canvas = $('#viewport').get(0)
            var graph = new Graph(canvas)

            FB.Event.subscribe('auth.login', function(response) {

                var session = response.session

                var loadUserPicture = function(id) {
                    if (! nodesData[id]) nodesData[id] = {}
                    nodesData[id].pictureUrl = 'https://graph.facebook.com/' + id + '/picture?access_token=' + session.access_token
                }

                var mutualFriends = function(userId, callback) {
                    $.ajax({
                        url: 'https://api.facebook.com/method/friends.getMutualFriends?target_uid=' + userId + '&access_token=' + session.access_token + '&format=json',
                        dataType: 'jsonp',
                        success: function(data) { callback(data) },
                        error: function() { console.log('error') }
                    })
                }

                FB.api('/me/friends', function(response) {
                    for (var i = 0; i < response.data.length; i++) {
                        // if (i == 10) break // temporal
                        (function() {
                            var friendId = response.data[i].id
                            loadUserPicture(friendId)
                            mutualFriends(friendId, function(otherFriendsIds) {
                                for (var i = 0; i < otherFriendsIds.length; i++) {
                                    graph.sys.addEdge(friendId, otherFriendsIds[i])
                                }
                            })
                        })()
                    }
                })
            })
        }

        initGraph()
        initFacebook()
    })

})()
