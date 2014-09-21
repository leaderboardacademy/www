
function postGForm(formId, formConfig) {
    var validated = $("#" + formId).data('bootstrapValidator').isValid();
    if (validated) {
        if (null != formConfig) {
            var myData = {
                "draftResponse":[],
                "pageHistory":0,
                "fbzx": new Date().getTime(),
            };
            var myUrl = formConfig.url;
            var isValid = true;

            for (var i = 0; i < formConfig.fields.length; ++i) {
                var field = formConfig.fields[i];
                if (null != field.preset) {
                    myData[field.gid] = $.trim(field.preset).substring(0, 1000);;
                    continue;
                }
                if ("radio" == field.special) {
                    var value = $("input[name=" + formId + "-" + field.fid + "]:checked").val();
                    value = $.trim(value).substring(0, 1000);
                    if (isValid) {
                        myData[field.gid] = value;
                        continue;
                    }
                }
                if ($("#" + formId + "-" + field.fid).length == 1) {
                    var value = $("#" + formId + "-" + field.fid).val();
                    value = $.trim(value).substring(0, 1000);
                    if (isValid) {
                        myData[field.gid] = value;
                        continue;
                    }
                }
                isValid = false;
                break;
            }

            if (isValid) {
                $("#" + formId).hide();
                $("#" + formId + "-sending").show();
                $.ajax({
                  url: myUrl,
                  data: myData,
                  type: "POST",
                  complete: function(data, textStatus, XMLHttpRequest) {
                    $("#" + formId + "-sending").hide();
                    $("#" + formId + "-complete").show();
                    //Success message
                  },
                });
                if (typeof ga != 'undefined') {
                    ga('send', {
                          'hitType': 'event',
                          'eventCategory': 'form',
                          'eventAction': 'success',
                          'eventLabel': formId,
                          'nonInteraction': true,
                        });
                }
                return true;
            }
        }
    }
    // don't hide, so that return false can show the bootstrap validate error message
    //$("#" + formId).hide();
    //$("#" + formId + "-error").show();
    if (typeof ga != 'undefined') {
        ga('send', {
              'hitType': 'event',
              'eventCategory': 'form',
              'eventAction': 'fail',
              'eventLabel': formId,
            });
    }
    return false;
}

function getYoutubeVideoId(url) {
    //if(url.indexOf('?') === -1)
    //    return null;
    //var query = decodeURI(url).split('?')[1];
    //var params = query.split('&');
    //for(var i=0,l = params.length;i<l;i++)
    //    if(params[i].indexOf('v=') === 0)
    //        return params[i].replace('v=','');
    //return null;

    // alternatively
    // var url = "http://www.youtube.com/watch?v=yV3i6OoiR4w&feature=BFa&list=PL4A312BE02BA06BB7&lf=bf_play";
    //var videoUrl = url.replace(/^.*?(\?|&)(v=([^&]+)).*$/i,'$3');

    // http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[7].length==11){
        return match[7];
    }
    return null;
}
