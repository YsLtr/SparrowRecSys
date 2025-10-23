var getUrl = window.location;
var baseUrl = getUrl .protocol + "//" + getUrl.host + "/"
// 从localStorage中获取排序方式，如果没有则默认为rating
var currentSortBy = localStorage.getItem("sortBy") || "rating";

var ModelManager = {
    // 初始化模型管理器
    init: function() {
        this.loadModelList();
    },

    // 加载模型列表
    loadModelList: function() {
        $.ajax({
            url: '/getmodel?action=list',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.success) {
                    ModelManager.renderModelList(data.models, data.currentModel);
                } else {
                    ModelManager.showStatus('error', '加载模型列表失败: ' + data.message);
                }
            },
            error: function() {
                ModelManager.showStatus('error', '无法连接到服务器');
            }
        });
    },

    // 渲染模型列表
    renderModelList: function(models) {
        var modelSelector = $('#model-selector');
        modelSelector.empty(); // 清空现有选项

        models.forEach(function(model) {
            var option = $('<option></option>')
                .val(model.version) // 设置 option 的 value
                .text(model.displayName); // 设置 option 的显示文本

            if (model.isCurrent) {
                option.prop('selected', true); // 设置当前选中的模型
            }

            modelSelector.append(option);
        });
    },

    // 切换模型
    switchModel: function(version) {
        this.showStatus('info', '正在切换模型，请稍候...');

        $.ajax({
            url: '/getmodel',
            type: 'POST',
            data: {
                action: 'switch',
                version: version
            },
            dataType: 'json',
            success: function(data) {
                if (data.success) {
                    ModelManager.showStatus('success', data.message);
                    // 重新加载模型列表以更新当前状态
                    setTimeout(function() {
                        ModelManager.loadModelList();
                    }, 1000);
                } else {
                    ModelManager.showStatus('error', '模型切换失败: ' + data.message);
                }
            },
            error: function() {
                ModelManager.showStatus('error', '模型切换请求失败');
            }
        });
    },

    /**
     * 显示状态消息 (全新版本，支持通知堆叠)
     * @param {string} type - 消息类型 (success, error, info, warning)
     * @param {string} message - 要显示的消息内容
     * @param {boolean} persistent - 如果为true，通知将不会自动消失 (用于错误消息)
     */
    showStatus: function(type, message) {
        const container = $('#notification-container');
        const alertDiv = $('<div></div>');

        alertDiv.addClass('status-alert');
        switch(type) {
            case 'success': alertDiv.addClass('alert-success'); break;
            case 'error':   alertDiv.addClass('alert-danger'); break;
            case 'warning': alertDiv.addClass('alert-warning'); break;
            default:        alertDiv.addClass('alert-info'); break;
        }

        alertDiv.html(`
        <span>${message}</span>
        <button type="button" class="close">&times;</button>
    `);

        // 关键变更：将新创建的通知添加到容器的底部
        // 之前是 .prepend()
        container.append(alertDiv);

        // 封装一个移除函数，包含新的离场动画
        const removeAlert = () => {
            alertDiv.addClass('fading-out');
            // 等待动画结束后再从DOM中移除元素
            // 动画时长为 0.4s，这里可以稍微长一点以确保动画播完
            setTimeout(() => {
                alertDiv.remove();
            }, 400);
        };

        alertDiv.find('.close').on('click', removeAlert);

        if (type !== 'error') {
            setTimeout(removeAlert, 5000);
        }
    },
};

function appendMovie2Row(rowId, movieName, movieId, year, rating, rateNumber, genres, baseUrl) {

    var genresStr = "";
    $.each(genres, function(i, genre){
        genresStr += ('<div class="genre"><a href="'+baseUrl+'collection.html?type=genre&value='+genre+'"><b>'+genre+'</b></a></div>');
    });


    var divstr = '<div class="movie-row-item" style="margin-right:5px">\
                    <movie-card-smart>\
                     <movie-card-md1>\
                      <div class="movie-card-md1">\
                       <div class="card">\
                        <link-or-emit>\
                         <a uisref="base.movie" href="./movie.html?movieId='+movieId+'">\
                         <span>\
                           <div class="poster">\
                            <img src="' + getPosterUrl(movieId) + '" onerror="handlePosterError(this, ' + movieId + ')" />\
                           </div>\
                           </span>\
                           </a>\
                        </link-or-emit>\
                        <div class="overlay">\
                         <div class="above-fold">\
                          <link-or-emit>\
                           <a uisref="base.movie" href="./movie.html?movieId='+movieId+'">\
                           <span><p class="title">' + movieName + '</p></span></a>\
                          </link-or-emit>\
                          <div class="rating-indicator">\
                           <ml4-rating-or-prediction>\
                            <div class="rating-or-prediction predicted">\
                             <svg xmlns:xlink="http://www.w3.org/1999/xlink" class="star-icon" height="14px" version="1.1" viewbox="0 0 14 14" width="14px" xmlns="http://www.w3.org/2000/svg">\
                              <defs></defs>\
                              <polygon fill-rule="evenodd" points="13.7714286 5.4939887 9.22142857 4.89188383 7.27142857 0.790044361 5.32142857 4.89188383 0.771428571 5.4939887 4.11428571 8.56096041 3.25071429 13.0202996 7.27142857 10.8282616 11.2921429 13.0202996 10.4285714 8.56096041" stroke="none"></polygon>\
                             </svg>\
                             <div class="rating-value">\
                              '+rating+'\
                             </div>\
                            </div>\
                           </ml4-rating-or-prediction>\
                          </div>\
                          <p class="year">'+year+'</p>\
                         </div>\
                         <div class="below-fold">\
                          <div class="genre-list">\
                           '+genresStr+'\
                          </div>\
                          <div class="ratings-display">\
                           <div class="rating-average">\
                            <span class="rating-large">'+rating+'</span>\
                            <span class="rating-total">/5</span>\
                            <p class="rating-caption"> '+rateNumber+' ratings </p>\
                           </div>\
                          </div>\
                         </div>\
                        </div>\
                       </div>\
                      </div>\
                     </movie-card-md1>\
                    </movie-card-smart>\
                   </div>';
    $('#'+rowId).append(divstr);
};


function addRowFrame(pageId, rowName, rowId, baseUrl) {
 var divstr = '<div class="frontpage-section-top"> \
                <div class="explore-header frontpage-section-header">\
                 <a class="plainlink" title="go to the full list" href="'+baseUrl+'collection.html?type=genre&value='+rowName+'">' + rowName + '</a> \
                </div>\
                <div class="movie-row">\
                 <div class="movie-row-bounds">\
                  <div class="movie-row-scrollable" id="' + rowId +'" style="margin-left: 0px;">\
                  </div>\
                 </div>\
                 <div class="clearfix"></div>\
                </div>\
               </div>'
     $(pageId).prepend(divstr);
};

function addRowFrameWithoutLink(pageId, rowName, rowId, baseUrl) {
 var divstr = '<div class="frontpage-section-top"> \
                <div class="explore-header frontpage-section-header">\
                 <a class="plainlink" title="go to the full list" href="'+baseUrl+'collection.html?type=genre&value='+rowName+'">' + rowName + '</a> \
                </div>\
                <div class="movie-row">\
                 <div class="movie-row-bounds">\
                  <div class="movie-row-scrollable" id="' + rowId +'" style="margin-left: 0px;">\
                  </div>\
                 </div>\
                 <div class="clearfix"></div>\
                </div>\
               </div>'
     $(pageId).prepend(divstr);
};

function addGenreRow(pageId, rowName, rowId, size, sortBy, baseUrl, reload) {
    if (reload) {
    } else {
        addRowFrame(pageId, rowName, rowId, baseUrl);
    }
    $.getJSON(baseUrl + "getrecommendation?genre="+rowName+"&size="+size+"&sortby="+sortBy, function(result){
        $.each(result, function(i, movie){
          appendMovie2Row(rowId, movie.title, movie.movieId, movie.releaseYear, movie.averageRating.toPrecision(2), movie.ratingNumber, movie.genres,baseUrl);
        });
    });
};

function addRelatedMovies(pageId, containerId, movieId, baseUrl){

    var rowDiv = '<div class="frontpage-section-top"> \
                <div class="explore-header frontpage-section-header">\
                 Related Movies \
                </div>\
                <div class="movie-row">\
                 <div class="movie-row-bounds">\
                  <div class="movie-row-scrollable" id="' + containerId +'" style="margin-left: 0px;">\
                  </div>\
                 </div>\
                 <div class="clearfix"></div>\
                </div>\
               </div>'
    $(pageId).prepend(rowDiv);

    $.getJSON(baseUrl + "getsimilarmovie?movieId="+movieId+"&size=16&model=emb", function(result){
            $.each(result, function(i, movie){
              appendMovie2Row(containerId, movie.title, movie.movieId, movie.releaseYear, movie.averageRating.toPrecision(2), movie.ratingNumber, movie.genres,baseUrl);
            });
    });
}

function addUserHistory(pageId, containerId, userId, baseUrl){

    var rowDiv = '<div class="frontpage-section-top"> \
                <div class="explore-header frontpage-section-header">\
                 User Watched Movies \
                </div>\
                <div class="movie-row">\
                 <div class="movie-row-bounds">\
                  <div class="movie-row-scrollable" id="' + containerId +'" style="margin-left: 0px;">\
                  </div>\
                 </div>\
                 <div class="clearfix"></div>\
                </div>\
               </div>'
    $(pageId).prepend(rowDiv);

    $.getJSON(baseUrl + "getuser?id="+userId, function(userObject){
            $.each(userObject.ratings, function(i, rating){
                $.getJSON(baseUrl + "getmovie?id="+rating.rating.movieId, function(movieObject){
                    appendMovie2Row(containerId, movieObject.title, movieObject.movieId, movieObject.releaseYear, rating.rating.score, movieObject.ratingNumber, movieObject.genres, baseUrl);
                });
            });
    });
}

function addRecForYou(pageId, containerId, userId, model, baseUrl){

    var rowDiv = '<div class="frontpage-section-top"> \
                <div class="explore-header frontpage-section-header">\
                 Recommended For You \
                </div>\
                <div class="movie-row">\
                 <div class="movie-row-bounds">\
                  <div class="movie-row-scrollable" id="' + containerId +'" style="margin-left: 0px;">\
                  </div>\
                 </div>\
                 <div class="clearfix"></div>\
                </div>\
               </div>'
    $(pageId).prepend(rowDiv);

    $.getJSON(baseUrl + "getrecforyou?id="+userId+"&size=32&model=" + model, function(result){
                $.each(result, function(i, movie){
                  appendMovie2Row(containerId, movie.title, movie.movieId, movie.releaseYear, movie.averageRating.toPrecision(2), movie.ratingNumber, movie.genres,baseUrl);
                });
     });
}


function addMovieDetails(containerId, movieId, baseUrl) {

    $.getJSON(baseUrl + "getmovie?id="+movieId, function(movieObject){
        var genres = "";
        $.each(movieObject.genres, function(i, genre){
                genres += ('<span><a href="'+baseUrl+'collection.html?type=genre&value='+genre+'"><b>'+genre+'</b></a>');
                if(i < movieObject.genres.length-1){
                    genres+=", </span>";
                }else{
                    genres+="</span>";
                }
        });

        var ratingUsers = "";
                $.each(movieObject.topRatings, function(i, rating){
                        ratingUsers += ('<span><a href="'+baseUrl+'user.html?id='+rating.rating.userId+'"><b>User'+rating.rating.userId+'</b></a>');
                        if(i < movieObject.topRatings.length-1){
                            ratingUsers+=", </span>";
                        }else{
                            ratingUsers+="</span>";
                        }
                });

        var movieDetails = '<div class="row movie-details-header movie-details-block">\
                                        <div class="col-md-2 header-backdrop">\
                                            <img alt="movie backdrop image" height="250" src="' + getPosterUrl(movieObject.movieId) + '" onerror="handlePosterError(this, ' + movieObject.movieId + ')">\
                                        </div>\
                                        <div class="col-md-9"><h1 class="movie-title"> '+movieObject.title+' </h1>\
                                            <div class="row movie-highlights">\
                                                <div class="col-md-2">\
                                                    <div class="heading-and-data">\
                                                        <div class="movie-details-heading">Release Year</div>\
                                                        <div> '+movieObject.releaseYear+' </div>\
                                                    </div>\
                                                    <div class="heading-and-data">\
                                                        <div class="movie-details-heading">Links</div>\
                                                        <a target="_blank" href="http://www.imdb.com/title/tt'+movieObject.imdbId+'">imdb</a>,\
                                                        <span><a target="_blank" href="http://www.themoviedb.org/movie/'+movieObject.tmdbId+'">tmdb</a></span>\
                                                    </div>\
                                                </div>\
                                                <div class="col-md-3">\
                                                    <div class="heading-and-data">\
                                                        <div class="movie-details-heading"> MovieLens predicts for you</div>\
                                                        <div> 5.0 stars</div>\
                                                    </div>\
                                                    <div class="heading-and-data">\
                                                        <div class="movie-details-heading"> Average of '+movieObject.ratingNumber+' ratings</div>\
                                                        <div> '+movieObject.averageRating.toPrecision(2)+' stars\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                                <div class="col-md-6">\
                                                    <div class="heading-and-data">\
                                                        <div class="movie-details-heading">Genres</div>\
                                                        '+genres+'\
                                                    </div>\
                                                    <div class="heading-and-data">\
                                                        <div class="movie-details-heading">Who likes the movie most</div>\
                                                        '+ratingUsers+'\
                                                    </div>\
                                                </div>\
                                            </div>\
                                        </div>\
                                    </div>'
        $("#"+containerId).prepend(movieDetails);
    });
};

function addUserDetails(containerId, userId, baseUrl) {

    $.getJSON(baseUrl + "getuser?id="+userId, function(userObject){
        var userDetails = '<div class="row movie-details-header movie-details-block">\
                                        <div class="col-md-2 header-backdrop">\
                                            <img alt="movie backdrop image" height="200" src="./images/avatar/'+userObject.userId%10+'.png">\
                                        </div>\
                                        <div class="col-md-9"><h1 class="movie-title"> User'+userObject.userId+' </h1>\
                                            <div class="row movie-highlights">\
                                                <div class="col-md-2">\
                                                    <div class="heading-and-data">\
                                                        <div class="movie-details-heading">#Watched Movies</div>\
                                                        <div> '+userObject.ratingCount+' </div>\
                                                    </div>\
                                                    <div class="heading-and-data">\
                                                        <div class="movie-details-heading"> Average Rating Score</div>\
                                                        <div> '+userObject.averageRating.toPrecision(2)+' stars\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                                <div class="col-md-3">\
                                                    <div class="heading-and-data">\
                                                        <div class="movie-details-heading"> Highest Rating Score</div>\
                                                        <div> '+userObject.highestRating+' stars</div>\
                                                    </div>\
                                                    <div class="heading-and-data">\
                                                        <div class="movie-details-heading"> Lowest Rating Score</div>\
                                                        <div> '+userObject.lowestRating+' stars\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                                <div class="col-md-6">\
                                                    <div class="heading-and-data">\
                                                        <div class="movie-details-heading">Favourite Genres</div>\
                                                        '+'action'+'\
                                                    </div>\
                                                </div>\
                                            </div>\
                                        </div>\
                                    </div>'
        $("#"+containerId).prepend(userDetails);
    });
};

function changeSortMethod() {
    currentSortBy = $("#sort-selector").val();
    // 将排序方式保存到localStorage
    localStorage.setItem("sortBy", currentSortBy);

    // 清空现有行
    $("#action-collection").empty();
    $("#romance-collection").empty();
    $("#thriller-collection").empty();
    $("#comedy-collection").empty();
    $("#drama-collection").empty();
    $("#adventure-collection").empty();

    // 重新加载数据
    addGenreRow('#recPage', 'Action', 'action-collection', 8, currentSortBy, baseUrl, 1);
    addGenreRow('#recPage', 'Romance', 'romance-collection', 8, currentSortBy, baseUrl, 1);
    addGenreRow('#recPage', 'Thriller', 'thriller-collection', 8, currentSortBy, baseUrl, 1);
    addGenreRow('#recPage', 'Comedy', 'comedy-collection', 8, currentSortBy, baseUrl, 1);
    addGenreRow('#recPage', 'Drama', 'drama-collection', 8, currentSortBy, baseUrl, 1);
    addGenreRow('#recPage', 'Adventure', 'adventure-collection', 8, currentSortBy, baseUrl, 1);
}

// 页面加载时设置选择器的值为当前排序方式并加载电影列表
$(document).ready(function() {

    ModelManager.init();
    // 设置排序选择器的值
    $("#sort-selector").val(currentSortBy);

    // 加载电影列表
    addGenreRow('#recPage', 'Action', 'action-collection', 8, currentSortBy, baseUrl, 0);
    addGenreRow('#recPage', 'Romance', 'romance-collection', 8, currentSortBy, baseUrl, 0);
    addGenreRow('#recPage', 'Thriller', 'thriller-collection', 8, currentSortBy, baseUrl, 0);
    addGenreRow('#recPage', 'Comedy', 'comedy-collection', 8, currentSortBy, baseUrl, 0);
    addGenreRow('#recPage', 'Drama', 'drama-collection', 8, currentSortBy, baseUrl, 0);
    addGenreRow('#recPage', 'Adventure', 'adventure-collection', 8, currentSortBy, baseUrl, 0);
});




