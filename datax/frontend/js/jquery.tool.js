$.ajaxSetup({
    //data: {csrfmiddlewaretoken: '{{ csrf_token }}' },jnpedit屏蔽 会影响api post提交
    beforeSend: function (xhr) {
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));//jnp add post需要
    }
});
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = $.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showLoading() {
    $(".loading-content").removeClass('hide');
}
function hideLoading() {
    $(".loading-content").addClass('hide');
}