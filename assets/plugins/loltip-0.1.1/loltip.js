LoLTip = {

    options: {
        scope: function () {
            return jQuery(document.body)
        },
        langsBySubdomain: {
            fr: 'fr',
            es: 'es'
        },
        stylesheet: 'http://tooltip.lolbuilder.net/v/0.1.1/release/loltip.min.css',
        loaded: new Date().getTime(),
        tooltip: {
            hrefs: '' +
                'a[href^="http://lolbuilder.net/"],' +
                'a[href^="http://www.lolbuilder.net/"],' +
                'a[href^="http://dev.lolbuilder.net/"],' +
                'a[href^="http://fr.lolbuilder.net/"],' +
                'a[href^="http://it.lolbuilder.net/"],' +
                'a[href^="http://es.lolbuilder.net/"],' +
                'a[href^="http://ru.lolbuilder.net/"],' +
                'a[href^="http://pt.lolbuilder.net/"],' +
                'a[href^="http://de.lolbuilder.net/"],' +
                'a[href^="http://ko.lolbuilder.net/"]',
            regex: 'item/|rune/|mastery/|spell/|aatrox|ahri|akali|alistar|amumu|anivia|annie|ashe|blitzcrank|brand|caitlyn|cassiopeia|chogath|corki|darius|diana|draven|drmundo|elise|evelynn|ezreal|fiddlesticks|fiora|fizz|galio|gangplank|garen|gragas|graves|gnar|hecarim|heimerdinger|irelia|janna|jarvaniv|jax|jayce|jinx|karma|karthus|kassadin|katarina|kayle|kennen|khazix|kogmaw|leblanc|leesin|leona|lissandra|lucian|lulu|lux|malphite|malzahar|maokai|masteryi|missfortune|mordekaiser|morgana|nami|nasus|nautilus|nidalee|nocturne|nunu|olaf|orianna|pantheon|poppy|quinn|rammus|renekton|rengar|riven|rumble|ryze|sejuani|shaco|shen|shyvana|singed|sion|sivir|skarner|sona|soraka|swain|syndra|talon|taric|teemo|thresh|tristana|trundle|tryndamere|twistedfate|twitch|udyr|urgot|varus|vayne|veigar|velkoz|vi|viktor|vladimir|volibear|warwick|wukong|xerath|xinzhao|yasuo|yorick|zac|zed|ziggs|zilean|zyra',
            wrapper: '[]',
            showdelay: 90,
            hidedelay: 400,
            opacity: true,
            updateAnchorText: true,

            /** options used for development */
            cssEditor: false,
            neverHide: false,
            solo: true
        }
    },

    init: function (opts) {
        LoLTip.options = jQuery.extend(true, LoLTip.options, opts || {});
        LoLTip._addStyles();
        LoLTip.add(opts);
    },

    add: function (opts) {

        opts = jQuery.extend({}, LoLTip.options, opts);

        var anchors = jQuery(opts.scope).find(LoLTip.options.tooltip.hrefs);
        if (LoLTip.options.tooltip.regex) {
            var pattern = new RegExp(LoLTip.options.tooltip.regex, 'gi');
            anchors = jQuery(anchors).filter(function () {
                return jQuery(this).attr('href').match(pattern) != null;
            });
        }

        var midpoint = LoLTip.options.tooltip.wrapper.length / 2;
        var left = LoLTip.options.tooltip.wrapper.substr(0, midpoint);
        var right = LoLTip.options.tooltip.wrapper.substr(midpoint);

        /* decorate the anchors in some way */
        anchors.addClass('loltip-anchor').each(function () {
            if (jQuery(this).hasClass('decorated')) return;
            if (jQuery(this).attr('data-loltip-skip') === 'true') return;
            if (!(!LoLTip.options.tooltip.updateAnchorText
                || jQuery(this).attr('data-update-text') === 'false'
                || jQuery(this).find('img'))) {
                jQuery(this)
                    .text(left + jQuery(this).text() + right)
                    .addClass('decorated');
            }
        });

        function hide() {
            if (LoLTip.options.tooltip.neverHide == true) return false;
            return {
                delay: LoLTip.options.tooltip.hidedelay,
                fixed: true,
                leave: false
            }
        }

        function position() {
            if (!LoLTip.options.tooltip.cssEditor) return {
                target: 'mouse',
                viewport: jQuery(window),
                adjust: {
                    x: 20,
                    y: 6
                }
            }
            else return {
                my: 'top left',
                at: 'bottom left',
                target: jQuery('[data-tooltip-target]')
            }
        }

        anchors.loltip({
            prerender: true,
            style: 'loltip-tipsy',
            position: position(),
            show: {
                delay: LoLTip.options.tooltip.showdelay,
                solo: LoLTip.options.tooltip.solo
            },
            hide: hide(),
            content: {
                text: function (event, api) {

                    var href = this.attr('href');

                    if (!href || href == 'undefined') {
                        api.set('content.title', '<p>Entity not found.</p>');
                        return false;
                    }

                    start = new Date().getTime()

                    jQuery.ajax({
                        type: 'GET',
                        url: href + '/json',
                        dataType: 'jsonp',
                        jsonpCallback: 'tip'
                    })
                        .fail(function (jqXHR, textStatus, errorThrown) {
                            api.set('content.text', new t(LoLTip.Templates.failed).render({
                                text: textStatus,
                                error: errorThrown
                            }));
                        }).done(function (data) {

                            LoLTip._decorateResponse(data);

                            var lang = '';
                            try {
                                var subdomain = href.match('(?:http://)?(?:([^.]+)\.)?lolbuilder.net')[1];
                                lang = LoLTip.options.langsBySubdomain[subdomain];
                            } catch (e) {
                            }

                            var rawTemplate = LoLTip.Templates.find(data);
                            var translatedTemplate = LoLTip.Templates.translate(rawTemplate, lang);

                            var html = new t(translatedTemplate).render(data);
                            var translatedHtml = LoLTip.Templates.translate(html, lang);

                            api.set('content.text', translatedHtml)

                        });

                    return LoLTip.Templates.loading;
                }
            }
        });
    },

    _decorateResponse: function (data) {

        if (!data || !data.databaseItemType) return;
        var entity = data.databaseItemType;


        if (entity === 'rune') {
            jQuery.extend(data, {
                intel: data.description
                    .replace(/([+-]?\d?\.?\d+[%]?)/g, '<i>$1</i>')
                    .replace(/\(/g, '<br/>(')
                    .replace(/(\(.*\))/g, '<span class="cap">$1</span>')
            })
        }
        else if (entity === 'mastery') {

            jQuery.extend(data, {
                intel: [data.description.length + 1]
            });

            if (data.id >= 4100 && data.id < 4200) data.tree = LoLTip.Strings.get('Offense');
            if (data.id >= 4200 && data.id < 4300) data.tree = LoLTip.Strings.get('Defense');
            if (data.id >= 4300 && data.id < 4400) data.tree = LoLTip.Strings.get('Utility');

            jQuery(data.description).each(function (index, str) {

                data.intel[index + 1] = str
                    .replace(/([+-]?\d?\.?\d+[%]?)/g, '<i>$1<\/i>')
                    .replace(/<br><br>(.*)/g, ' <span class="disclaimer">$1<\/span>');
            });

            data.intel[0] = '';
        }
        else if (entity === 'spell') {
            jQuery.extend(data, {
                intel: data.description
                    .replace(/([+-]?\d?\.?\d+[%]?)/g, '<i>$1</i>')
            });
        }
        else if (entity === 'ability') {
            //noinspection JSValidateTypes
            jQuery.extend(data, {
                intel: data.description
                    .replace(/([+-]?\d?\.?\d+[%]?\/?)/g, '<i>$1</i>')
                    .replace(/(Attack Damage)/g, '<span class="ad">$1</span>')
                    .replace(/(Ability Power)/g, '<span class="ap">$1</span>')
            });
        }
    },


    _failToDecorate: function (element) {
        /* do nothing */
    },

    _addStyles: function () {

        if (location.href.indexOf('localhost') > -1) {
            jQuery('#loltip-dev-css').remove();
            jQuery('head').append('<link rel="stylesheet" id="loltip-dev-css" type="text/css" href="http://localhost/lolbuilder/tooltips/v/0.1.1/src/lib/jquery.loltip/jquery.loltip.css">');
        }
        else {
            jQuery('#loltip-min-css').remove();
            jQuery('head').append('<link rel="stylesheet" id="loltip-min-css" type="text/css" href="' + LoLTip.options.stylesheet + '">');
        }

        var styles = [];

        if (LoLTip.options.tooltip.opacity === false || LoLTip.options.tooltip.opacity === 'false') {
            styles.push('.loltip-tipsy {background: rgba(0, 0, 0, 1) !important;}');
        } else if (jQuery.isNumeric(LoLTip.options.tooltip.opacity)) {
            styles.push('.loltip-tipsy {background: rgba(0, 0, 0, ' + LoLTip.options.tooltip.opacity + ') !important;}');
        }

        jQuery('#loltip-style').remove();
        jQuery("<style>")
            .attr('id', 'loltip-style')
            .prop("type", "text/css")
            .html(styles.toString().replace(/},/g, '} '))
            .appendTo("head");
    },


    Strings: {

        dict: {
            'Offense': {en: 'Offense', fr: 'Infraction', es: 'Ofensa'},
            'Defense': {en: 'Defense', fr: 'Défense', es: 'Defensa'},
            'Utility': {en: 'Utility', fr: 'Utilitaire', es: 'Utilidad'},
            'Ability Power': {en: 'Ability Power', fr: 'capacité d\'alimentation', es: 'Poder de Abilidad'},
            'Buy': {en: 'Buy', fr: 'Acheter', es: 'Comprar'},
            'Sell': {en: 'Sell', fr: 'Vendre', es: 'Vender'},
            'Health': {en: 'Health', fr: 'Santé', es: 'Vida'},
            'HP per 5': {en: 'HP per 5', fr: 'HP par 5', es: 'HP por 5'},
            'Mana': {en: 'Mana', fr: 'Mana', es: 'Mana'},
            'MP per 5': {en: 'MP per 5', fr: 'MP par 5', es: 'MP por 5'},
            'Armor': {en: 'Armor', fr: 'Armure', es: 'Armadura'},
            'Magic Resist': {en: 'Magic Resist', fr: 'Résist. magique', es: 'Resistencia Mágica'},
            'Attack Damage': {en: 'Attack Damage', fr: 'Dégâts d\'attaque', es: 'Daño de Ataque'},
            'Attack Range': {en: 'Attack Range', fr: 'Attack Plage', es: 'Rango de Ataque'},
            'Crit Chance': {en: 'Crit Chance', fr: 'Coup critique', es: 'Probabilidad de Crítico'},
            'Life Steal': {en: 'Life Steal', fr: 'Vol de vie', es: 'Robo de Vida'},
            'Attack Speed': {en: 'Attack Speed', fr: 'Vitesse d\'attaque', es: 'Velocidad de Ataque'},
            'Movement': {en: 'Movement', fr: 'Mouvement', es: 'Movimiento'},
            'per lvl': {en: 'per lvl', fr: 'par lvl', es: 'por nivel'},
            'Released': {en: 'Released', fr: 'Sepuis', es: 'Liberado'},
            'Cooldown': {en: 'Cooldown', fr: 'Recharge', es: 'Enfriamiento'},
            'seconds': {en: 'seconds', fr: 'Secondes', es: 'segundos'},
            'Requires Level': {en: 'Requires Level', fr: 'Niveau requis', es: 'Requiere Nivel'}
        },

        get: function (key, lang) {

            lang = lang || 'en';

            if (!LoLTip.Strings.dict[key]) return key;
            if (!LoLTip.Strings.dict[key][lang]) return LoLTip.Strings.dict[key]['en'];
            return LoLTip.Strings.dict[key][lang];

        }
    }

};

jQuery(document).ready(function () {
    setTimeout(function () {
        LoLTip.init(window.loltipConfig || {});
    }, 100);
});

/**
 * var paths = jQuery.unique(                        // get only unique fragments
 *  jQuery(document.body)                            // search body for
 *   .find(LoLTip.options.tooltip.hrefs)        //    anchors to given domains
 *   .map(function(){
 *      return jQuery(this).attr('href')             // extract the full anchors
 *   }))
 *   .get().join(',')                           // to a string
 *   .replace(/http:\/\/(.+?)\//g,'')           // then remove the domain from the URLS
 */
/*
 jQuery.unique(jQuery(document.body)
 .find(LoLTip.options.tooltip.hrefs)
 .map(function () {
 return jQuery(this).attr('href')
 })).get().join(',').replace(/http:\/\/(.+?)\//g, '');
 */

/**
 * TODO utilize entities.js to rewrite anchor text
 * TODO update templates to utilize sprite ?
 * TODO add options to hide components of tooltips via css classes and _addStyles
 * TODO add additional champion details to the champion tooltip
 */



//noinspection JSValidateTypes
jQuery.extend(LoLTip, {

    Templates: {

        find: function (data) {

            if (data === null) return this.failed;

            var entity = data.databaseItemType;
            if (!entity) return this.failed;

            var found;
            jQuery.each(LoLTip.Templates, function (key, element) {
                if (!found && key.toLowerCase() === entity.toLowerCase()) found = ('LoLTip.Templates' + '.' + key);
            });

            if (found) return eval(found);
            else return LoLTip.Templates.failed;
        },


        translate: function (raw, lang) {
            lang = lang || 'en';

            var html = raw;
            var reg = /@\[(.*?)\]/m;

            var result;
            while ((result = reg.exec(html)) !== null) {
                var block = result[0];
                var key = result[1];
                html = html.replace(block, LoLTip.Strings.get(key, lang));
            }

            jQuery.each(LoLTip.Strings.dict, function () {
                if (!this.en || !this[lang]) return;

                var en = this.en;
                var translated = this[lang];

                html = html.replace(new RegExp(en, 'g'), translated);

            });

            return html;
        },

        loading: "" +
            "<div>" +
            "  <div class='lt-loading'>" +
            "    <p>...</p>" +
            "  </div>" +
            "</div>",

        failed: "" +
            "<div>" +
            "  <div class=\"lt-loading\">" +
            "  </div>" +
            "  <div class=\"lt-powered-by\">" +
            "    <a href=\"http://lolbuilder.net\">" +
            "      <span class=\"lt-url\"><img src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGsAAAASCAYAAABckiAFAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAABtlJREFUWEftmXesVEUUhxEFWxRsEBHF2LtGEcSKFexgV0CMRvnDEhXBHlSs0RjEQhSxYkOx926sWLDEht2oRI0t9vrW75t7Zt/uvrfvoTwVlV/y5c6cO/fu3Clnzsy2a0uVSqU5YBnYDg6Fs+FaeBBehLfgE/gGfoJf4be4mv8WPocPYRq8BI/B7XANXACjYTgMhm1gbVgKOkQ1ZqueaKSlwY65A76Af0p2+mfgoLgLLoZRsB9sBSvCvFHt/5f48I3gHrCRWtPH8BRMhnPhRDgE9oFdoB/4vvVgXVgL1oDVYPVIa+sJvWF96Av9YScYBPvCgXAknAxnwUVwHdwJj4Iz9Wmw3lfCSTAUNoSu8Wn/HfFRHWAcNEBz+hrsFDtjA+gUj85Sol5zw6KwUtRT1z0QNgYHRg+YP4r/O8UH6F6a07uwN8zSrob6OZPPbyP2gvlnkDmjCm0jXqibsRJDwlQl7I645vQ8dIL2cBBcCD3isSphd/2YAJfVMAb6RbFWRdmj4TzQHfp7w+JWE3HvcLgcXF9NvwEGNH+ntorqzLx42TxgJKaGhrlK2A0klFHdveBirjvcN+4PAfUVdEwPVQjb4tBaIw2M4nVFmQXhh1S6VHo8ri/E7Sphnws+TSVKpQFh1u73bgYOlJ/hr5QDpX389MyLl7nIKwOGLmGuEvYdQJ/eDVyU1wGDgM3j/k2gbkgP1Ai7kZl6H/YMdCWnQtYJ0BHm9RqPJpG34bV3BuuhJ3BWq9OjjLPbgMR1aD7oA+pHSOsnV9/RC/yGxWBleAbaWs/Czv5mm4qXjk2vJ2oLUxNxz/D3gVSqUe+Bi7QLtsGF2iceqRL2G4vbpbFhSiLfvTAnbQvOXDUiilhma3B/9jLkdVOX7R5N2XlGiq+mXCHXUYMhdT8YHBkp+p6sX+BYsGOf1DATcg9p5DkSVo2q/ynxvG1i3ecIU6Mwvg3q+DBVCbszKO+jXoPKsN2N75ZFMtmahMHYKjvT9caRL3bOQ6DuhlWKZFL5g0k/XJhKZ8JHRbI0Ja66bzvru5QrOtvNdGXEegTcXCRTeb3AOylX1HlJcE37XkMr0m1OhGHg1sFBslhUdabFuxYA2+qOMDUKozMja50wl4VN15LdjYt66m2ulyQL6wWcUyRLU9JDNcKeO7Oe7Cg71EZVNmT+nYUgryt53bQjsuuy4fNgcx+XIi+uBi1Z2pXvTYOJa+V3bxK2q4tsXbke97ZsS6KMdb4VDoPjwLX1Kugc910zndEOQgeWs9EToK5hU9Z1v/TCLAy5gRyxTaYdth3T3WKal0Nz0m48lcHGm0WyNCpuVwl7bjjXK12FeNJgXtn4RnYeTalz41Gf3a0wpRnhcZMyovuySJaf8ePK6xzpo5K1sH9QJNOm2I4TN8ZZy8YzI4psXR2cXt6KKJcHpwGVbltPpIbHffei3nPwTwLlBt0BNDXlCk/QN70wC0P+2PFhqhL2/FETwpRE3g9Xl8ZV9YzbZWFzxNi46oAwJ5HvUpiTHGk5WuwfRSxjNKV0t56EqPzbrjnPFcnSGfFIEnnPFFV2lw4II8Na9Ax5FhvgtKTUqa2JcscUxUujI+/+TnlYkIOe0+Ke7eNAvD7yufOqXSsG90fZxTQbNmN3UVcjw6TNIx9llOWBrZoOTUJUbCuku8Xa0D3MSeS3SHcKefyjXHvSDOZqUOCMVrrAHFDkzjIoyFuO/dNLEWlHaP6u/PHT43ZdUeaRomhdrR5FWxTldM0Ojm6RPwWUEWie8bWaHGXfhXdMVwnjrpYK6V/3r8HwPK8HkxsaGgx7XVCz+/KwNEeIjvDa50WfrTwj3CMwbDfQyB3hQbB55eLqnszfyq7W33NBV3ZOdrvOhLznsoE8QvJ88RUNyODFU3rlrPX80TKeIRoV6vrTVoWrEWdlUNKcxqSGa0WU873TImv+PnDwGHXm+ni85TZoeVgT3JK4lVCT4tFGYXRT2JI8MxtfJJMqP0b3tzC0tNF1ragN92vlIavvMbLK8sOctcrOM9rLM8TAItfDUxUX6Oake7Mx3HflGVkpB0+vaAf/avHUvjXpHVzjq46PyDto9CzOaMNu6zcx7hmgub5Ojfxy4AB7Ajzx0Uv495B2B5Oy7oMsXxYGI7rb6mA047mWo8H9iQufYfsNsH0878xzbaiHU97FtNbuLHCRdzCUXSfp3cE9kTPHj9E1LgH6dcNln9XtejVy027IfQW8DtbP/Zyb7fJ/XKQHgINCL+G658n/InHPGZvD/hmVM73S7fpfm/XVbevq3BAPjnt2nvnytoj0pmB9HMzOuj5ht61vCXsKRmarQjSKf504E/4o4+IVf4PatfsdLzIrEuCwiDgAAAAASUVORK5CYII=\"/></span>" +
            "    </a>" +
            "  </div>" +
            "</div>",


        item: "" +
            "<div class=\"lt-item\">" +
            "  <div class='lt-build-from lt-pull-right' data-depth='{{=depth}}'>" +
            "     <a href=\"http://lolbuilder.net/item/{{id}}\"><img src='http://ddragon.leagueoflegends.com/cdn/{{=version}}/img/item/{{=image_full}}' /></a>" +
            "     <div class=\"lt-build-from\">" +
            "       {{@from}}<a href=\"http://lolbuilder.net/item/{{%_val}}\"><img src='http://ddragon.leagueoflegends.com/cdn/{{=version}}/img/item/{{%_val}}.png' /></a>{{/@from}}" +
            "     </div>" +
            "  </div>" +
            "  <div class=\"lt-img\">" +
            "    <a href=\"http://lolbuilder.net/item/{{id}}\">" +
            "      <img src='http://ddragon.leagueoflegends.com/cdn/{{=version}}/img/item/{{=image_full}}' />" +
            "    </a>" +
            "  </div>" +
            "  <div class=\"lt-info\">" +
            "    <div class=\"lt-name\">{{=name}}</div>" +
            "    <div class=\"lt-quick-description\">{{=plaintext}}</div>" +
            "    <div class=\"lt-description\">{{=description}}</div>" +
            "    <div class=\"lt-tags\">{{@tags}}<span class=\"lt-tag\">#{{%_val}}</span>{{/@tags}}</div>" +
            "    <div class=\"lt-cost\" data-purchasable=\"{{=gold_purchasable}}\">" +
            "      <div class=\"lt-buy\">@[Buy]: <span class=\"lt-gold\">{{=gold_total}} ({{=gold_base}})</span></div> " +
            "      <div class=\"lt-sell\">@[Sell]: <span class=\"lt-gold\">{{=gold_sell}}</span></div> " +
            "    </div>" +
            "  </div>" +
            "</div>",

        champion: "" +
            "<div class=\"lt-champion\">" +
            "  <div class=\"lt-left\">" +
            "    <div class=\"lt-intro\">" +
            "      <div class=\"lt-img\">" +
            "        <a href=\"http://lolbuilder.net/{{=slug}}\">" +
            "          <img src='http://ddragon.leagueoflegends.com/cdn/{{=version}}/img/champion/{{=image_full}}' />" +
            "        </a>" +
            "      </div>" +
            "      <div class=\"lt-name\"><a href=\"http://lolbuilder.net/{{=slug}}\">{{=name}}</a></div>" +
            "      <div class=\"lt-title\">{{=title}}</div>" +
            "      <div class=\"lt-tags\">{{@tags}}<span class=\"lt-tag\">#{{%_val}}</span>{{/@tags}}</div>" +
            "    </div>" +
            "    <br/>" +
            "    <div class=\"lt-info\">" +
            "      <div class=\"lt-line-graphs\">" +
            "        <div class=\"lt-stat lt-attack\"><div class=\"lt-img-attack\"></div> <span class=\"lt-p-bar\"><span class=\"lt-p-bar-fill\" style=\"width:{{=attack}}0%\"></span></span></div>" +
            "        <div class=\"lt-stat lt-defense\"><div class=\"lt-img-defense\"></div> <span class=\"lt-p-bar\"><span class=\"lt-p-bar-fill\" style=\"width:{{=defense}}0%\"></span></span></div>" +
            "        <div class=\"lt-stat lt-magic\"><div class=\"lt-img-magic\"></div> <span class=\"lt-p-bar\"><span class=\"lt-p-bar-fill\" style=\"width:{{=magic}}0%\"></span></span></div>" +
            "        <div class=\"lt-stat lt-difficulty\"><div class=\"lt-img-diff\"></div> <span class=\"lt-p-bar\"><span class=\"lt-p-bar-fill\" style=\"width:{{=difficulty}}0%\"></span></span></div>" +
            "      </div>" +
            "    </div>" +
            "  </div>" + // end .li-left
            "  <div class=\"lt-data lt-right\">" +
            "   <table>" +
            "   <tbody>" +
            "     <tr class=\"lt-row-o\"><td>@[Health]</td><td><i>{{=hp}}</i></td><td>{{hpperlevel}}<em>+{{=hpperlevel}}</em> @[per lvl]{{/hpperlevel}}</td></tr>" +
            "     <tr class=\"lt-row-e\"><td>@[HP per 5]</td><td><i>{{=hpregen}}</i></td><td>{{hpregenperlevel}}<em>+{{=hpregenperlevel}}</em> @[per lvl]{{/hpregenperlevel}}</td></tr>" +
            "     <tr class=\"lt-row-o\"><td>@[Mana]</td><td><i>{{=mp}}</i></td><td>{{mpperlevel}}<em>+{{=mpperlevel}}</em> @[per lvl]{{/mpperlevel}}</td></tr>" +
            "     <tr class=\"lt-row-e\"><td>@[MP per 5]</td><td><i>{{=mpregen}}</i></td><td>{{mpregenperlevel}}<em>+{{=mpregenperlevel}}</em> @[per lvl]{{/mpregenperlevel}}</td></tr>" +
            "     <tr class=\"lt-row-o\"><td>@[Armor]</td><td><i>{{=armor}}</i></td><td>{{armorperlevel}}<em>+{{=armorperlevel}}</em> @[per lvl]{{/armorperlevel}}</td></tr>" +
            "     <tr class=\"lt-row-e\"><td>@[Magic Resist]</td><td><i>{{=spellblock}}</i></td><td>{{spellblockperlevel}}<em>+{{=spellblockperlevel}}</em> @[per lvl]{{/spellblockperlevel}}</td></tr>" +
            "     <tr class=\"lt-row-o\"><td>@[Attack Damage]</td><td><i>{{=attackdamage}}</i></td><td>{{attackdamageperlevel}}<em>+{{=attackdamageperlevel}}</em> @[per lvl]{{/attackdamageperlevel}}</td></tr>" +
            "     <tr class=\"lt-row-e\"><td>@[Attack Range]</td><td colspan=\"2\"><i>{{=attackrange}}</i></td></tr>" +
            "     <tr class=\"lt-row-o\"><td>@[Crit Chance]</td><td><i>{{=crit}}</i></td><td>{{critperlevel}}<em>+{{=critperlevel}}</em> @[per lvl]{{/critperlevel}}</td></tr>" +
            "     <tr class=\"lt-row-e\"><td>@[Movement]</td><td colspan=\"2\"><i>{{=movespeed}}</i></td></tr>" +
            "   </tbody>" +
            "   </table>" +
            "  </div>" + // end .li-right
            "  <div class=\"lt-cost\">" +
            "    <div class=\"lt-rp\"><div class=\"lt-img-rp\"></div> <span class=\"lt-gold\">{{=rp}}</span></div> " +
            "    <div class=\"lt-ip\"><div class=\"lt-img-ip\"></div> <span class=\"lt-gold\">{{=ip}}</span></div> " +
            "    <div class=\"lt-released\">@[Released]: <span class=\"lt-date\">{{=released}}</span></div> " +
            "  </div>" +
            "</div>",

        rune: "" +
            "<div class=\"lt-rune\">" +
            "  <div class=\"lt-img\"><img src='http://ddragon.leagueoflegends.com/cdn/{{=version}}/img/rune/{{=image_full}}'/></div>" +
            "  <div class=\"lt-intro\">" +
            "    <div class=\"lt-name\">{{=name}}</div>" +
            "    <div class=\"lt-intel\">{{=intel}}</div>" +
            "    <div class=\"lt-tags\">{{@tags}}<span class=\"lt-tag\">#{{%_val}}</span>{{/@tags}}</div>" +
            "{{ip}}" +
            "    <div class=\"lt-cost\">" +
            "      <div class=\"lt-ip\"><div class=\"lt-img-ip\"></div> <span class=\"lt-gold\">{{=ip}}</span></div> " +
            "    </div>" +
            "{{/ip}}" +
            "  </div>" +
            "</div>",

        mastery: "" +
            "<div class=\"lt-mastery\">" +
            "  <div class=\"lt-img\"><img src='http://ddragon.leagueoflegends.com/cdn/{{=version}}/img/mastery/{{=image_full}}'/></div>" +
            "  <div class=\"lt-intro\">" +
            "    <div class=\"lt-name\">{{=name}}</div>" +
            "    {{tree}}<div class=\"lt-tree\">#{{=tree}}</div>{{/tree}}" +
            "    <div class=\"lt-intels\">" +
            "      {{@intel}}<div class=\"lt-intel\" data-points=\"{{=_key}}\"><span class=\"lt-points\">{{=_key}}:</span> {{=_val}}</div>{{/@intel}}" +
            "    </div>" +
            "  </div>" +
            "</div>",

        spell: "" +
            "<div class=\"lt-spell\">" +
            "  <div class=\"lt-img\">" +
            "    <div class=\"lt-im\" style=\"height:48px; width:48px; background: url('http://ddragon.leagueoflegends.com/cdn/{{=version}}/img/sprite/spell0.png') -{{=x}}px -{{=y}}px no-repeat;\"></div>" +
            "  </div>" +
            "  <div class=\"lt-intro\">" +
            "    <div class=\"lt-name\">{{=name}}</div>" +
            "    <div class=\"lt-intel\">{{=intel}}</div>" +
            "    {{cooldown}}<div class=\"lt-cooldown\">@[Cooldown]: <i>{{=cooldown}}</i> @[seconds]</div>{{/cooldown}}" +
            "    {{level}}<div class=\"lt-lvl\">@[Requires Level]: <i>{{=level}}</i></div>{{/level}}" +
            "  </div>" +
            "</div>",

        ability: "" +
            "<div class=\"lt-ability\" data-key=\"{{=button}}\">" +
            "  <div class=\"lt-img\"> " +
            "    <a href=\"http://lolbuilder.net/champion/{{=championName}}\"> " +
            "      <img class=\"lt-spell-img\" src=\"http://ddragon.leagueoflegends.com/cdn/{{=version}}/img/spell/{{=image}}\"/>" +
            "      <img class=\"lt-passive-img\" src=\"http://ddragon.leagueoflegends.com/cdn/{{=version}}/img/passive/{{=image}}\"/>" +
            "    </a>" +
            "  </div>" +
            "  <div class=\"lt-intro\">" +
            "    <div class=\"lt-name\">{{=name}} <span class=\"lt-kbd\">{{=button}}</span></div>" +
            "    {{championName}}<div class=\"lt-champion\"><a href=\"http://lolbuilder.net/champion/{{=championName}}/\">{{=championName}}</a></div>{{/championName}}" +
            "   {{intel}}" +
            "    <div class=\"lt-intel\">{{=intel}}</div>" +
            "   {{:intel}}" +
            "    <div class=\"lt-description\">{{=description}}</div>" +
            "   {{/intel}}" +
            "  </div>" +
            "</div>"
    }
});

jQuery.extend(LoLTip, {
    Champion: {
        Annie: 1,
        Olaf: 2,
        Galio: 3,
        TwistedFate: 4,
        XinZhao: 5,
        Urgot: 6,
        LeBlanc: 7,
        Vladimir: 8,
        Fiddlesticks: 9,
        Kayle: 10,
        MasterYi: 11,
        Alistar: 12,
        Ryze: 13,
        Sion: 14,
        Sivir: 15,
        Soraka: 16,
        Teemo: 17,
        Tristana: 18,
        Warwick: 19,
        Nunu: 20,
        MissFortune: 21,
        Ashe: 22,
        Tryndamere: 23,
        Jax: 24,
        Morgana: 25,
        Zilean: 26,
        Singed: 27,
        Evelynn: 28,
        Twitch: 29,
        Karthus: 30,
        ChoGath: 31,
        Amumu: 32,
        Rammus: 33,
        Anivia: 34,
        Shaco: 35,
        DrMundo: 36,
        Sona: 37,
        Kassadin: 38,
        Irelia: 39,
        Janna: 40,
        Gangplank: 41,
        Corki: 42,
        Karma: 43,
        Taric: 44,
        Veigar: 45,
        Trundle: 48,
        Swain: 50,
        Caitlyn: 51,
        Blitzcrank: 53,
        Malphite: 54,
        Katarina: 55,
        Nocturne: 56,
        Maokai: 57,
        Renekton: 58,
        JarvanIV: 59,
        Elise: 60,
        Orianna: 61,
        Wukong: 62,
        Brand: 63,
        LeeSin: 64,
        Vayne: 67,
        Rumble: 68,
        Cassiopeia: 69,
        Skarner: 72,
        Heimerdinger: 74,
        Nasus: 75,
        Nidalee: 76,
        Udyr: 77,
        Poppy: 78,
        Gragas: 79,
        Pantheon: 80,
        Ezreal: 81,
        Mordekaiser: 82,
        Yorick: 83,
        Akali: 84,
        Kennen: 85,
        Garen: 86,
        Leona: 89,
        Malzahar: 90,
        Talon: 91,
        Riven: 92,
        KogMaw: 96,
        Shen: 98,
        Lux: 99,
        Xerath: 101,
        Shyvana: 102,
        Ahri: 103,
        Graves: 104,
        Fizz: 105,
        Volibear: 106,
        Rengar: 107,
        Varus: 110,
        Nautilus: 111,
        Viktor: 112,
        Sejuani: 113,
        Fiora: 114,
        Ziggs: 115,
        Lulu: 117,
        Draven: 119,
        Hecarim: 120,
        KhaZix: 121,
        Darius: 122,
        Jayce: 126,
        Lissandra: 127,
        Diana: 131,
        Quinn: 133,
        Syndra: 134,
        Zyra: 143,
        Zac: 154,
        Lucian: 236,
        Zed: 238,
        Vi: 254,
        Aatrox: 266,
        Nami: 267,
        Thresh: 412,
        Jinx: 222,
        Yasuo: 157,
        VelKoz: 161,
        Braum: 201
    },
    Ability: {
        AnniePassive: 'annie/passive',
        AnnieQ: 'annie/q',
        AnnieW: 'annie/w',
        AnnieE: 'annie/e',
        AnnieR: 'annie/r',
        OlafPassive: 'olaf/passive',
        OlafQ: 'olaf/q',
        OlafW: 'olaf/w',
        OlafE: 'olaf/e',
        OlafR: 'olaf/r',
        GalioPassive: 'galio/passive',
        GalioQ: 'galio/q',
        GalioW: 'galio/w',
        GalioE: 'galio/e',
        GalioR: 'galio/r',
        TwistedfatePassive: 'twistedfate/passive',
        TwistedfateQ: 'twistedfate/q',
        TwistedfateW: 'twistedfate/w',
        TwistedfateE: 'twistedfate/e',
        TwistedfateR: 'twistedfate/r',
        XinzhaoPassive: 'xinzhao/passive',
        XinzhaoQ: 'xinzhao/q',
        XinzhaoW: 'xinzhao/w',
        XinzhaoE: 'xinzhao/e',
        XinzhaoR: 'xinzhao/r',
        UrgotPassive: 'urgot/passive',
        UrgotQ: 'urgot/q',
        UrgotW: 'urgot/w',
        UrgotE: 'urgot/e',
        UrgotR: 'urgot/r',
        LeblancPassive: 'leblanc/passive',
        LeblancQ: 'leblanc/q',
        LeblancW: 'leblanc/w',
        LeblancE: 'leblanc/e',
        LeblancR: 'leblanc/r',
        VladimirPassive: 'vladimir/passive',
        VladimirQ: 'vladimir/q',
        VladimirW: 'vladimir/w',
        VladimirE: 'vladimir/e',
        VladimirR: 'vladimir/r',
        FiddlesticksPassive: 'fiddlesticks/passive',
        FiddlesticksQ: 'fiddlesticks/q',
        FiddlesticksW: 'fiddlesticks/w',
        FiddlesticksE: 'fiddlesticks/e',
        FiddlesticksR: 'fiddlesticks/r',
        KaylePassive: 'kayle/passive',
        KayleQ: 'kayle/q',
        KayleW: 'kayle/w',
        KayleE: 'kayle/e',
        KayleR: 'kayle/r',
        MasteryiPassive: 'masteryi/passive',
        MasteryiQ: 'masteryi/q',
        MasteryiW: 'masteryi/w',
        MasteryiE: 'masteryi/e',
        MasteryiR: 'masteryi/r',
        AlistarPassive: 'alistar/passive',
        AlistarQ: 'alistar/q',
        AlistarW: 'alistar/w',
        AlistarE: 'alistar/e',
        AlistarR: 'alistar/r',
        RyzePassive: 'ryze/passive',
        RyzeQ: 'ryze/q',
        RyzeW: 'ryze/w',
        RyzeE: 'ryze/e',
        RyzeR: 'ryze/r',
        SionPassive: 'sion/passive',
        SionQ: 'sion/q',
        SionW: 'sion/w',
        SionE: 'sion/e',
        SionR: 'sion/r',
        SivirPassive: 'sivir/passive',
        SivirQ: 'sivir/q',
        SivirW: 'sivir/w',
        SivirE: 'sivir/e',
        SivirR: 'sivir/r',
        SorakaPassive: 'soraka/passive',
        SorakaQ: 'soraka/q',
        SorakaW: 'soraka/w',
        SorakaE: 'soraka/e',
        SorakaR: 'soraka/r',
        TeemoPassive: 'teemo/passive',
        TeemoQ: 'teemo/q',
        TeemoW: 'teemo/w',
        TeemoE: 'teemo/e',
        TeemoR: 'teemo/r',
        TristanaPassive: 'tristana/passive',
        TristanaQ: 'tristana/q',
        TristanaW: 'tristana/w',
        TristanaE: 'tristana/e',
        TristanaR: 'tristana/r',
        WarwickPassive: 'warwick/passive',
        WarwickQ: 'warwick/q',
        WarwickW: 'warwick/w',
        WarwickE: 'warwick/e',
        WarwickR: 'warwick/r',
        NunuPassive: 'nunu/passive',
        NunuQ: 'nunu/q',
        NunuW: 'nunu/w',
        NunuE: 'nunu/e',
        NunuR: 'nunu/r',
        MissfortunePassive: 'missfortune/passive',
        MissfortuneQ: 'missfortune/q',
        MissfortuneW: 'missfortune/w',
        MissfortuneE: 'missfortune/e',
        MissfortuneR: 'missfortune/r',
        AshePassive: 'ashe/passive',
        AsheQ: 'ashe/q',
        AsheW: 'ashe/w',
        AsheE: 'ashe/e',
        AsheR: 'ashe/r',
        TryndamerePassive: 'tryndamere/passive',
        TryndamereQ: 'tryndamere/q',
        TryndamereW: 'tryndamere/w',
        TryndamereE: 'tryndamere/e',
        TryndamereR: 'tryndamere/r',
        JaxPassive: 'jax/passive',
        JaxQ: 'jax/q',
        JaxW: 'jax/w',
        JaxE: 'jax/e',
        JaxR: 'jax/r',
        MorganaPassive: 'morgana/passive',
        MorganaQ: 'morgana/q',
        MorganaW: 'morgana/w',
        MorganaE: 'morgana/e',
        MorganaR: 'morgana/r',
        ZileanPassive: 'zilean/passive',
        ZileanQ: 'zilean/q',
        ZileanW: 'zilean/w',
        ZileanE: 'zilean/e',
        ZileanR: 'zilean/r',
        SingedPassive: 'singed/passive',
        SingedQ: 'singed/q',
        SingedW: 'singed/w',
        SingedE: 'singed/e',
        SingedR: 'singed/r',
        EvelynnPassive: 'evelynn/passive',
        EvelynnQ: 'evelynn/q',
        EvelynnW: 'evelynn/w',
        EvelynnE: 'evelynn/e',
        EvelynnR: 'evelynn/r',
        TwitchPassive: 'twitch/passive',
        TwitchQ: 'twitch/q',
        TwitchW: 'twitch/w',
        TwitchE: 'twitch/e',
        TwitchR: 'twitch/r',
        KarthusPassive: 'karthus/passive',
        KarthusQ: 'karthus/q',
        KarthusW: 'karthus/w',
        KarthusE: 'karthus/e',
        KarthusR: 'karthus/r',
        ChogathPassive: 'chogath/passive',
        ChogathQ: 'chogath/q',
        ChogathW: 'chogath/w',
        ChogathE: 'chogath/e',
        ChogathR: 'chogath/r',
        AmumuPassive: 'amumu/passive',
        AmumuQ: 'amumu/q',
        AmumuW: 'amumu/w',
        AmumuE: 'amumu/e',
        AmumuR: 'amumu/r',
        RammusPassive: 'rammus/passive',
        RammusQ: 'rammus/q',
        RammusW: 'rammus/w',
        RammusE: 'rammus/e',
        RammusR: 'rammus/r',
        AniviaPassive: 'anivia/passive',
        AniviaQ: 'anivia/q',
        AniviaW: 'anivia/w',
        AniviaE: 'anivia/e',
        AniviaR: 'anivia/r',
        ShacoPassive: 'shaco/passive',
        ShacoQ: 'shaco/q',
        ShacoW: 'shaco/w',
        ShacoE: 'shaco/e',
        ShacoR: 'shaco/r',
        DrmundoPassive: 'drmundo/passive',
        DrmundoQ: 'drmundo/q',
        DrmundoW: 'drmundo/w',
        DrmundoE: 'drmundo/e',
        DrmundoR: 'drmundo/r',
        SonaPassive: 'sona/passive',
        SonaQ: 'sona/q',
        SonaW: 'sona/w',
        SonaE: 'sona/e',
        SonaR: 'sona/r',
        KassadinPassive: 'kassadin/passive',
        KassadinQ: 'kassadin/q',
        KassadinW: 'kassadin/w',
        KassadinE: 'kassadin/e',
        KassadinR: 'kassadin/r',
        IreliaPassive: 'irelia/passive',
        IreliaQ: 'irelia/q',
        IreliaW: 'irelia/w',
        IreliaE: 'irelia/e',
        IreliaR: 'irelia/r',
        JannaPassive: 'janna/passive',
        JannaQ: 'janna/q',
        JannaW: 'janna/w',
        JannaE: 'janna/e',
        JannaR: 'janna/r',
        GangplankPassive: 'gangplank/passive',
        GangplankQ: 'gangplank/q',
        GangplankW: 'gangplank/w',
        GangplankE: 'gangplank/e',
        GangplankR: 'gangplank/r',
        CorkiPassive: 'corki/passive',
        CorkiQ: 'corki/q',
        CorkiW: 'corki/w',
        CorkiE: 'corki/e',
        CorkiR: 'corki/r',
        KarmaPassive: 'karma/passive',
        KarmaQ: 'karma/q',
        KarmaW: 'karma/w',
        KarmaE: 'karma/e',
        KarmaR: 'karma/r',
        TaricPassive: 'taric/passive',
        TaricQ: 'taric/q',
        TaricW: 'taric/w',
        TaricE: 'taric/e',
        TaricR: 'taric/r',
        VeigarPassive: 'veigar/passive',
        VeigarQ: 'veigar/q',
        VeigarW: 'veigar/w',
        VeigarE: 'veigar/e',
        VeigarR: 'veigar/r',
        TrundlePassive: 'trundle/passive',
        TrundleQ: 'trundle/q',
        TrundleW: 'trundle/w',
        TrundleE: 'trundle/e',
        TrundleR: 'trundle/r',
        SwainPassive: 'swain/passive',
        SwainQ: 'swain/q',
        SwainW: 'swain/w',
        SwainE: 'swain/e',
        SwainR: 'swain/r',
        CaitlynPassive: 'caitlyn/passive',
        CaitlynQ: 'caitlyn/q',
        CaitlynW: 'caitlyn/w',
        CaitlynE: 'caitlyn/e',
        CaitlynR: 'caitlyn/r',
        BlitzcrankPassive: 'blitzcrank/passive',
        BlitzcrankQ: 'blitzcrank/q',
        BlitzcrankW: 'blitzcrank/w',
        BlitzcrankE: 'blitzcrank/e',
        BlitzcrankR: 'blitzcrank/r',
        MalphitePassive: 'malphite/passive',
        MalphiteQ: 'malphite/q',
        MalphiteW: 'malphite/w',
        MalphiteE: 'malphite/e',
        MalphiteR: 'malphite/r',
        KatarinaPassive: 'katarina/passive',
        KatarinaQ: 'katarina/q',
        KatarinaW: 'katarina/w',
        KatarinaE: 'katarina/e',
        KatarinaR: 'katarina/r',
        NocturnePassive: 'nocturne/passive',
        NocturneQ: 'nocturne/q',
        NocturneW: 'nocturne/w',
        NocturneE: 'nocturne/e',
        NocturneR: 'nocturne/r',
        MaokaiPassive: 'maokai/passive',
        MaokaiQ: 'maokai/q',
        MaokaiW: 'maokai/w',
        MaokaiE: 'maokai/e',
        MaokaiR: 'maokai/r',
        RenektonPassive: 'renekton/passive',
        RenektonQ: 'renekton/q',
        RenektonW: 'renekton/w',
        RenektonE: 'renekton/e',
        RenektonR: 'renekton/r',
        JarvanivPassive: 'jarvaniv/passive',
        JarvanivQ: 'jarvaniv/q',
        JarvanivW: 'jarvaniv/w',
        JarvanivE: 'jarvaniv/e',
        JarvanivR: 'jarvaniv/r',
        ElisePassive: 'elise/passive',
        EliseQ: 'elise/q',
        EliseW: 'elise/w',
        EliseE: 'elise/e',
        EliseR: 'elise/r',
        OriannaPassive: 'orianna/passive',
        OriannaQ: 'orianna/q',
        OriannaW: 'orianna/w',
        OriannaE: 'orianna/e',
        OriannaR: 'orianna/r',
        MonkeykingPassive: 'monkeyking/passive',
        MonkeykingQ: 'monkeyking/q',
        MonkeykingW: 'monkeyking/w',
        MonkeykingE: 'monkeyking/e',
        MonkeykingR: 'monkeyking/r',
        BrandPassive: 'brand/passive',
        BrandQ: 'brand/q',
        BrandW: 'brand/w',
        BrandE: 'brand/e',
        BrandR: 'brand/r',
        LeesinPassive: 'leesin/passive',
        LeesinQ: 'leesin/q',
        LeesinW: 'leesin/w',
        LeesinE: 'leesin/e',
        LeesinR: 'leesin/r',
        VaynePassive: 'vayne/passive',
        VayneQ: 'vayne/q',
        VayneW: 'vayne/w',
        VayneE: 'vayne/e',
        VayneR: 'vayne/r',
        RumblePassive: 'rumble/passive',
        RumbleQ: 'rumble/q',
        RumbleW: 'rumble/w',
        RumbleE: 'rumble/e',
        RumbleR: 'rumble/r',
        CassiopeiaPassive: 'cassiopeia/passive',
        CassiopeiaQ: 'cassiopeia/q',
        CassiopeiaW: 'cassiopeia/w',
        CassiopeiaE: 'cassiopeia/e',
        CassiopeiaR: 'cassiopeia/r',
        SkarnerPassive: 'skarner/passive',
        SkarnerQ: 'skarner/q',
        SkarnerW: 'skarner/w',
        SkarnerE: 'skarner/e',
        SkarnerR: 'skarner/r',
        HeimerdingerPassive: 'heimerdinger/passive',
        HeimerdingerQ: 'heimerdinger/q',
        HeimerdingerW: 'heimerdinger/w',
        HeimerdingerE: 'heimerdinger/e',
        HeimerdingerR: 'heimerdinger/r',
        NasusPassive: 'nasus/passive',
        NasusQ: 'nasus/q',
        NasusW: 'nasus/w',
        NasusE: 'nasus/e',
        NasusR: 'nasus/r',
        NidaleePassive: 'nidalee/passive',
        NidaleeQ: 'nidalee/q',
        NidaleeW: 'nidalee/w',
        NidaleeE: 'nidalee/e',
        NidaleeR: 'nidalee/r',
        UdyrPassive: 'udyr/passive',
        UdyrQ: 'udyr/q',
        UdyrW: 'udyr/w',
        UdyrE: 'udyr/e',
        UdyrR: 'udyr/r',
        PoppyPassive: 'poppy/passive',
        PoppyQ: 'poppy/q',
        PoppyW: 'poppy/w',
        PoppyE: 'poppy/e',
        PoppyR: 'poppy/r',
        GragasPassive: 'gragas/passive',
        GragasQ: 'gragas/q',
        GragasW: 'gragas/w',
        GragasE: 'gragas/e',
        GragasR: 'gragas/r',
        PantheonPassive: 'pantheon/passive',
        PantheonQ: 'pantheon/q',
        PantheonW: 'pantheon/w',
        PantheonE: 'pantheon/e',
        PantheonR: 'pantheon/r',
        EzrealPassive: 'ezreal/passive',
        EzrealQ: 'ezreal/q',
        EzrealW: 'ezreal/w',
        EzrealE: 'ezreal/e',
        EzrealR: 'ezreal/r',
        MordekaiserPassive: 'mordekaiser/passive',
        MordekaiserQ: 'mordekaiser/q',
        MordekaiserW: 'mordekaiser/w',
        MordekaiserE: 'mordekaiser/e',
        MordekaiserR: 'mordekaiser/r',
        YorickPassive: 'yorick/passive',
        YorickQ: 'yorick/q',
        YorickW: 'yorick/w',
        YorickE: 'yorick/e',
        YorickR: 'yorick/r',
        AkaliPassive: 'akali/passive',
        AkaliQ: 'akali/q',
        AkaliW: 'akali/w',
        AkaliE: 'akali/e',
        AkaliR: 'akali/r',
        KennenPassive: 'kennen/passive',
        KennenQ: 'kennen/q',
        KennenW: 'kennen/w',
        KennenE: 'kennen/e',
        KennenR: 'kennen/r',
        GarenPassive: 'garen/passive',
        GarenQ: 'garen/q',
        GarenW: 'garen/w',
        GarenE: 'garen/e',
        GarenR: 'garen/r',
        LeonaPassive: 'leona/passive',
        LeonaQ: 'leona/q',
        LeonaW: 'leona/w',
        LeonaE: 'leona/e',
        LeonaR: 'leona/r',
        MalzaharPassive: 'malzahar/passive',
        MalzaharQ: 'malzahar/q',
        MalzaharW: 'malzahar/w',
        MalzaharE: 'malzahar/e',
        MalzaharR: 'malzahar/r',
        TalonPassive: 'talon/passive',
        TalonQ: 'talon/q',
        TalonW: 'talon/w',
        TalonE: 'talon/e',
        TalonR: 'talon/r',
        RivenPassive: 'riven/passive',
        RivenQ: 'riven/q',
        RivenW: 'riven/w',
        RivenE: 'riven/e',
        RivenR: 'riven/r',
        KogmawPassive: 'kogmaw/passive',
        KogmawQ: 'kogmaw/q',
        KogmawW: 'kogmaw/w',
        KogmawE: 'kogmaw/e',
        KogmawR: 'kogmaw/r',
        ShenPassive: 'shen/passive',
        ShenQ: 'shen/q',
        ShenW: 'shen/w',
        ShenE: 'shen/e',
        ShenR: 'shen/r',
        LuxPassive: 'lux/passive',
        LuxQ: 'lux/q',
        LuxW: 'lux/w',
        LuxE: 'lux/e',
        LuxR: 'lux/r',
        XerathPassive: 'xerath/passive',
        XerathQ: 'xerath/q',
        XerathW: 'xerath/w',
        XerathE: 'xerath/e',
        XerathR: 'xerath/r',
        ShyvanaPassive: 'shyvana/passive',
        ShyvanaQ: 'shyvana/q',
        ShyvanaW: 'shyvana/w',
        ShyvanaE: 'shyvana/e',
        ShyvanaR: 'shyvana/r',
        AhriPassive: 'ahri/passive',
        AhriQ: 'ahri/q',
        AhriW: 'ahri/w',
        AhriE: 'ahri/e',
        AhriR: 'ahri/r',
        GravesPassive: 'graves/passive',
        GravesQ: 'graves/q',
        GravesW: 'graves/w',
        GravesE: 'graves/e',
        GravesR: 'graves/r',
        FizzPassive: 'fizz/passive',
        FizzQ: 'fizz/q',
        FizzW: 'fizz/w',
        FizzE: 'fizz/e',
        FizzR: 'fizz/r',
        VolibearPassive: 'volibear/passive',
        VolibearQ: 'volibear/q',
        VolibearW: 'volibear/w',
        VolibearE: 'volibear/e',
        VolibearR: 'volibear/r',
        RengarPassive: 'rengar/passive',
        RengarQ: 'rengar/q',
        RengarW: 'rengar/w',
        RengarE: 'rengar/e',
        RengarR: 'rengar/r',
        VarusPassive: 'varus/passive',
        VarusQ: 'varus/q',
        VarusW: 'varus/w',
        VarusE: 'varus/e',
        VarusR: 'varus/r',
        NautilusPassive: 'nautilus/passive',
        NautilusQ: 'nautilus/q',
        NautilusW: 'nautilus/w',
        NautilusE: 'nautilus/e',
        NautilusR: 'nautilus/r',
        ViktorPassive: 'viktor/passive',
        ViktorQ: 'viktor/q',
        ViktorW: 'viktor/w',
        ViktorE: 'viktor/e',
        ViktorR: 'viktor/r',
        SejuaniPassive: 'sejuani/passive',
        SejuaniQ: 'sejuani/q',
        SejuaniW: 'sejuani/w',
        SejuaniE: 'sejuani/e',
        SejuaniR: 'sejuani/r',
        FioraPassive: 'fiora/passive',
        FioraQ: 'fiora/q',
        FioraW: 'fiora/w',
        FioraE: 'fiora/e',
        FioraR: 'fiora/r',
        ZiggsPassive: 'ziggs/passive',
        ZiggsQ: 'ziggs/q',
        ZiggsW: 'ziggs/w',
        ZiggsE: 'ziggs/e',
        ZiggsR: 'ziggs/r',
        LuluPassive: 'lulu/passive',
        LuluQ: 'lulu/q',
        LuluW: 'lulu/w',
        LuluE: 'lulu/e',
        LuluR: 'lulu/r',
        DravenPassive: 'draven/passive',
        DravenQ: 'draven/q',
        DravenW: 'draven/w',
        DravenE: 'draven/e',
        DravenR: 'draven/r',
        HecarimPassive: 'hecarim/passive',
        HecarimQ: 'hecarim/q',
        HecarimW: 'hecarim/w',
        HecarimE: 'hecarim/e',
        HecarimR: 'hecarim/r',
        KhazixPassive: 'khazix/passive',
        KhazixQ: 'khazix/q',
        KhazixW: 'khazix/w',
        KhazixE: 'khazix/e',
        KhazixR: 'khazix/r',
        DariusPassive: 'darius/passive',
        DariusQ: 'darius/q',
        DariusW: 'darius/w',
        DariusE: 'darius/e',
        DariusR: 'darius/r',
        JaycePassive: 'jayce/passive',
        JayceQ: 'jayce/q',
        JayceW: 'jayce/w',
        JayceE: 'jayce/e',
        JayceR: 'jayce/r',
        LissandraPassive: 'lissandra/passive',
        LissandraQ: 'lissandra/q',
        LissandraW: 'lissandra/w',
        LissandraE: 'lissandra/e',
        LissandraR: 'lissandra/r',
        DianaPassive: 'diana/passive',
        DianaQ: 'diana/q',
        DianaW: 'diana/w',
        DianaE: 'diana/e',
        DianaR: 'diana/r',
        QuinnPassive: 'quinn/passive',
        QuinnQ: 'quinn/q',
        QuinnW: 'quinn/w',
        QuinnE: 'quinn/e',
        QuinnR: 'quinn/r',
        SyndraPassive: 'syndra/passive',
        SyndraQ: 'syndra/q',
        SyndraW: 'syndra/w',
        SyndraE: 'syndra/e',
        SyndraR: 'syndra/r',
        ZyraPassive: 'zyra/passive',
        ZyraQ: 'zyra/q',
        ZyraW: 'zyra/w',
        ZyraE: 'zyra/e',
        ZyraR: 'zyra/r',
        ZacPassive: 'zac/passive',
        ZacQ: 'zac/q',
        ZacW: 'zac/w',
        ZacE: 'zac/e',
        ZacR: 'zac/r',
        LucianPassive: 'lucian/passive',
        LucianQ: 'lucian/q',
        LucianW: 'lucian/w',
        LucianE: 'lucian/e',
        LucianR: 'lucian/r',
        ZedPassive: 'zed/passive',
        ZedQ: 'zed/q',
        ZedW: 'zed/w',
        ZedE: 'zed/e',
        ZedR: 'zed/r',
        ViPassive: 'vi/passive',
        ViQ: 'vi/q',
        ViW: 'vi/w',
        ViE: 'vi/e',
        ViR: 'vi/r',
        AatroxPassive: 'aatrox/passive',
        AatroxQ: 'aatrox/q',
        AatroxW: 'aatrox/w',
        AatroxE: 'aatrox/e',
        AatroxR: 'aatrox/r',
        NamiPassive: 'nami/passive',
        NamiQ: 'nami/q',
        NamiW: 'nami/w',
        NamiE: 'nami/e',
        NamiR: 'nami/r',
        ThreshPassive: 'thresh/passive',
        ThreshQ: 'thresh/q',
        ThreshW: 'thresh/w',
        ThreshE: 'thresh/e',
        ThreshR: 'thresh/r',
        JinxPassive: 'jinx/passive',
        JinxQ: 'jinx/q',
        JinxW: 'jinx/w',
        JinxE: 'jinx/e',
        JinxR: 'jinx/r',
        YasuoPassive: 'yasuo/passive',
        YasuoQ: 'yasuo/q',
        YasuoW: 'yasuo/w',
        YasuoE: 'yasuo/e',
        YasuoR: 'yasuo/r',
        VelkozPassive: 'velkoz/passive',
        VelkozQ: 'velkoz/q',
        VelkozW: 'velkoz/w',
        VelkozE: 'velkoz/e',
        VelkozR: 'velkoz/r',

        AatroxBladesofTorment: 'aatrox/e',
        AatroxBloodThirst: 'aatrox/w',
        AatroxBloodPrice: 'aatrox/w',
        AatroxBloodWell: 'aatrox/passive',
        AatroxDarkFlight: 'aatrox/q',
        AatroxMassacre: 'aatrox/r',
        AhriCharm: 'ahri/e',
        AhriEssenceTheft: 'ahri/passive',
        AhriFoxFire: 'ahri/w',
        AhriOrbofDeception: 'ahri/q',
        AhriSpiritRush: 'ahri/r',
        AkaliCrescentSlash: 'akali/e',
        AkaliMarkoftheAssassin: 'akali/q',
        AkaliShadowDance: 'akali/r',
        AkaliTwilightShroud: 'akali/w',
        AkaliTwinDisciplines: 'akali/passive',
        AlistarHeadbutt: 'alistar/w',
        AlistarPulverize: 'alistar/q',
        AlistarTrample: 'alistar/passive',
        AlistarTriumphantRoar: 'alistar/e',
        AlistarUnbreakableWill: 'alistar/r',
        AmumuBandageToss: 'amumu/q',
        AmumuCursedTouch: 'amumu/passive',
        AmumuCurseoftheSadMummy: 'amumu/r',
        AmumuDespair: 'amumu/w',
        AmumuTantrum: 'amumu/e',
        AniviaCrystallize: 'anivia/w',
        AniviaFlashFrost: 'anivia/q',
        AniviaFrostbite: 'anivia/e',
        AniviaGlacialStorm: 'anivia/r',
        AniviaRebirth: 'anivia/passive',
        AnnieDisintegrate: 'annie/q',
        AnnieIncinerate: 'annie/w',
        AnnieMoltenShield: 'annie/e',
        AnniePyromania: 'annie/passive',
        AnnieSummonTibbers: 'annie/r',
        AsheEnchantedCrystalArrow: 'ashe/r',
        AsheFocus: 'ashe/passive',
        AsheFrostShot: 'ashe/q',
        AsheHawkshot: 'ashe/e',
        AsheVolley: 'ashe/w',
        BlitzcrankManaBarrier: 'blitzcrank/passive',
        BlitzcrankOverdrive: 'blitzcrank/w',
        BlitzcrankPowerFist: 'blitzcrank/e',
        BlitzcrankRocketGrab: 'blitzcrank/q',
        BlitzcrankStaticField: 'blitzcrank/r',
        BrandBlaze: 'brand/passive',
        BrandConflagration: 'brand/e',
        BrandPillarofFlame: 'brand/w',
        BrandPyroclasm: 'brand/r',
        BrandSear: 'brand/q',
        Caitlyn90CaliberNet: 'caitlyn/e',
        CaitlynAceintheHole: 'caitlyn/r',
        CaitlynHeadshot: 'caitlyn/passive',
        CaitlynPiltoverPeacemaker: 'caitlyn/q',
        CaitlynYordleSnapTrap: 'caitlyn/w',
        CassiopeiaDeadlyCadence: 'cassiopeia/passive',
        CassiopeiaMiasma: 'cassiopeia/w',
        CassiopeiaNoxiousBlast: 'cassiopeia/q',
        CassiopeiaPetrifyingGaze: 'cassiopeia/r',
        CassiopeiaTwinFang: 'cassiopeia/e',
        ChogathCarnivore: 'chogath/passive',
        ChogathFeast: 'chogath/r',
        ChogathFeralScream: 'chogath/w',
        ChogathRupture: 'chogath/q',
        ChogathVorpalSpikes: 'chogath/e',
        CorkiGatlingGun: 'corki/e',
        CorkiHextechShrapnelShells: 'corki/passive',
        CorkiMissileBarrage: 'corki/r',
        CorkiPhosphorusBomb: 'corki/q',
        CorkiValkyrie: 'corki/w',
        DariusApprehend: 'darius/e',
        DariusCripplingStrike: 'darius/w',
        DariusDecimate: 'darius/q',
        DariusHemorrhage: 'darius/passive',
        DariusNoxianGuillotine: 'darius/r',
        DianaCrescentStrike: 'diana/q',
        DianaLunarRush: 'diana/r',
        DianaMoonfall: 'diana/e',
        DianaMoonsilverBlade: 'diana/passive',
        DianaPaleCascade: 'diana/w',
        DravenBloodRush: 'draven/w',
        DravenLeagueofDraven: 'draven/passive',
        DravenSpinningAxe: 'draven/q',
        DravenStandAside: 'draven/e',
        DravenWhirlingDeath: 'draven/r',
        DrMundoAdrenalineRush: 'drmundo/passive',
        DrMundoBurningAgony: 'drmundo/w',
        DrMundoInfectedCleaver: 'drmundo/q',
        DrMundoMasochism: 'drmundo/e',
        DrMundoSadism: 'drmundo/r',
        EliseCocoon: 'elise/e',
        EliseRappel: 'elise/e',
        EliseNeurotoxin: 'elise/q',
        EliseVenomousBite: 'elise/q',
        EliseSpiderForm: 'elise/r',
        EliseSpiderSwarm: 'elise/passive',
        EliseVolatileSpiderling: 'elise/w',
        EliseSkitteringFrenzy: 'elise/w',
        EvelynnAgonysEmbrace: 'evelynn/r',
        EvelynnDarkFrenzy: 'evelynn/w',
        EvelynnHateSpike: 'evelynn/q',
        EvelynnRavage: 'evelynn/e',
        EvelynnShadowWalk: 'evelynn/passive',
        EzrealArcaneShift: 'ezreal/e',
        EzrealEssenceFlux: 'ezreal/w',
        EzrealMysticShot: 'ezreal/q',
        EzrealRisingSpellForce: 'ezreal/passive',
        EzrealTrueshotBarrage: 'ezreal/r',
        FiddleSticksCrowstorm: 'fiddlesticks/r',
        FiddleSticksDarkWind: 'fiddlesticks/e',
        FiddleSticksDrain: 'fiddlesticks/w',
        FiddleSticksDread: 'fiddlesticks/passive',
        FiddleSticksTerrify: 'fiddlesticks/q',
        FioraBladeWaltz: 'fiora/r',
        FioraBurstofSpeed: 'fiora/e',
        FioraDuelist: 'fiora/passive',
        FioraLunge: 'fiora/q',
        FioraRiposte: 'fiora/w',
        FizzChumtheWaters: 'fizz/r',
        FizzNimbleFighter: 'fizz/passive',
        FizzPlayful: 'fizz/e',
        FizzTrickster: 'fizz/e',
        FizzSeastoneTrident: 'fizz/w',
        FizzUrchinStrike: 'fizz/q',
        GangplankCannonBarrage: 'gangplank/r',
        GangplankGrogSoakedBlade: 'gangplank/passive',
        GangplankParrrley: 'gangplank/q',
        GangplankRaiseMorale: 'gangplank/e',
        GangplankRemoveScurvy: 'gangplank/w',
        GarenCourage: 'garen/w',
        GarenDecisiveStrike: 'garen/q',
        GarenDemacianJustice: 'garen/r',
        GarenJudgment: 'garen/e',
        GarenPerseverance: 'garen/passive',
        GragasBarrelRoll: 'gragas/q',
        GragasBodySlam: 'gragas/e',
        GragasDrunkenRage: 'gragas/w',
        GragasExplosiveCask: 'gragas/r',
        GragasHappyHour: 'gragas/passive',
        GravesBuckshot: 'graves/q',
        GravesCollateralDamage: 'graves/r',
        GravesQuickdraw: 'graves/e',
        GravesSmokeScreen: 'graves/w',
        GravesTrueGrit: 'graves/passive',
        HecarimDevastatingCharge: 'hecarim/e',
        HecarimOnslaughtofShadows: 'hecarim/r',
        HecarimRampage: 'hecarim/q',
        HecarimSpiritofDread: 'hecarim/w',
        HecarimWarpath: 'hecarim/passive',
        HeimerdingerCH2ElectronStormGrenade: 'heimerdinger/e',
        HeimerdingerH28GEvolutionTurret: 'heimerdinger/q',
        HeimerdingerHextechMicroRockets: 'heimerdinger/w',
        HeimerdingerTechmaturgicalRepairBots: 'heimerdinger/passive',
        HeimerdingerUPGRADE: 'heimerdinger/r',
        IreliaBladesurge: 'irelia/q',
        IreliaEquilibriumStrike: 'irelia/e',
        IreliaHitenStyle: 'irelia/w',
        IreliaIonianFervor: 'irelia/passive',
        IreliaTranscendentBlades: 'irelia/r',
        JannaEyeOfTheStorm: 'janna/e',
        JannaHowlingGale: 'janna/q',
        JannaMonsoon: 'janna/r',
        JannaTailwind: 'janna/passive',
        JannaZephyr: 'janna/w',
        JarvanIVCataclysm: 'jarvaniv/r',
        JarvanIVDemacianStandard: 'jarvaniv/e',
        JarvanIVDragonStrike: 'jarvaniv/q',
        JarvanIVGoldenAegis: 'jarvaniv/w',
        JarvanIVMartialCadence: 'jarvaniv/passive',
        JaxCounterStrike: 'jax/e',
        JaxEmpower: 'jax/w',
        JaxGrandmastersMight: 'jax/r',
        JaxLeapStrike: 'jax/q',
        JaxRelentlessAssault: 'jax/passive',
        JayceHextechCapacitor: 'jayce/passive',
        JayceLightningField: 'jayce/w',
        JayceHyperCharge: 'jayce/w',
        JayceMercuryCannon: 'jayce/r',
        JayceMercuryHammer: 'jayce/r',
        JayceThunderingBlow: 'jayce/e',
        JayceAccelerationGate: 'jayce/e',
        JayceTotheSkies: 'jayce/q',
        JayceShockBlast: 'jayce/q',
        JinxFlameChompers: 'jinx/e',
        JinxGetExcited: 'jinx/passive',
        JinxSuperMegaDeathRocket: 'jinx/r',
        JinxSwitcheroo: 'jinx/q',
        JinxZap: 'jinx/w',
        KarmaFocusedResolve: 'karma/w',
        KarmaGatheringFire: 'karma/passive',
        KarmaInnerFlame: 'karma/q',
        KarmaInspire: 'karma/e',
        KarmaMantra: 'karma/r',
        KarthusDeathDefied: 'karthus/passive',
        KarthusDefile: 'karthus/e',
        KarthusLayWaste: 'karthus/q',
        KarthusRequiem: 'karthus/r',
        KarthusWallofPain: 'karthus/w',
        KassadinForcePulse: 'kassadin/e',
        KassadinNetherBlade: 'kassadin/w',
        KassadinNullSphere: 'kassadin/q',
        KassadinRiftwalk: 'kassadin/r',
        KassadinVoidStone: 'kassadin/passive',
        KatarinaBouncingBlades: 'katarina/q',
        KatarinaDeathLotus: 'katarina/r',
        KatarinaShunpo: 'katarina/e',
        KatarinaSinisterSteel: 'katarina/w',
        KayleDivineBlessing: 'kayle/w',
        KayleHolyFervor: 'kayle/passive',
        KayleIntervention: 'kayle/r',
        KayleReckoning: 'kayle/q',
        KayleRighteousFury: 'kayle/e',
        KennenElectricalSurge: 'kennen/w',
        KennenLightningRush: 'kennen/e',
        KennenMarkoftheStorm: 'kennen/passive',
        KennenSlicingMaelstrom: 'kennen/r',
        KennenThunderingShuriken: 'kennen/q',
        KhazixLeap: 'khazix/e',
        KhazixTasteTheirFear: 'khazix/q',
        KhazixUnseenThreat: 'khazix/passive',
        KhazixVoidAssault: 'khazix/r',
        KhazixVoidSpike: 'khazix/w',
        KogMawBioArcaneBarrage: 'kogmaw/w',
        KogMawIcathianSurprise: 'kogmaw/passive',
        KogMawLivingArtillery: 'kogmaw/r',
        KogMawVoidOoze: 'kogmaw/e',
        LeblancDistortion: 'leblanc/w',
        LeblancEtherealChains: 'leblanc/e',
        LeblancMimic: 'leblanc/r',
        LeeSinCripple: 'leesin/e',
        LeeSinDragonsRage: 'leesin/r',
        LeeSinFlurry: 'leesin/passive',
        LeeSinIronWill: 'leesin/w',
        LeeSinResonatingStrike: 'leesin/q',
        LeeSinSafeguard: 'leesin/w',
        LeeSinSonicWave: 'leesin/q',
        LeeSinTempest: 'leesin/e',
        LeonaEclipse: 'leona/w',
        LeonaShieldofDaybreak: 'leona/q',
        LeonaSolarFlare: 'leona/r',
        LeonaSunlight: 'leona/passive',
        LeonaZenithBlade: 'leona/e',
        LissandraFrozenTomb: 'lissandra/r',
        LissandraGlacialPath: 'lissandra/e',
        LissandraIceborn: 'lissandra/passive',
        LissandraIceShard: 'lissandra/q',
        LissandraRingofFrost: 'lissandra/w',
        LucianArdentBlaze: 'lucian/w',
        LucianLightslinger: 'lucian/passive',
        LucianPiercingLight: 'lucian/q',
        LucianRelentlessPursuit: 'lucian/e',
        LucianTheCulling: 'lucian/r',
        LuluGlitterlance: 'lulu/q',
        LuluHelpPix: 'lulu/e',
        LuluPixFaerieCompanion: 'lulu/passive',
        LuluWhimsy: 'lulu/w',
        LuluWildGrowth: 'lulu/r',
        LuxFinalSpark: 'lux/r',
        LuxIllumination: 'lux/passive',
        LuxLightBinding: 'lux/q',
        LuxLucentSingularity: 'lux/e',
        LuxPrismaticBarrier: 'lux/w',
        MalphiteBrutalStrikes: 'malphite/w',
        MalphiteGroundSlam: 'malphite/e',
        MalphiteSeismicShard: 'malphite/q',
        MalphiteUnstoppableForce: 'malphite/r',
        MalzaharCalloftheVoid: 'malzahar/q',
        MalzaharMaleficVisions: 'malzahar/e',
        MalzaharNetherGrasp: 'malzahar/r',
        MalzaharNullZone: 'malzahar/w',
        MalzaharSummonVoidling: 'malzahar/passive',
        MaokaiArcaneSmash: 'maokai/q',
        MaokaiSaplingToss: 'maokai/e',
        MaokaiTwistedAdvance: 'maokai/w',
        MaokaiVengefulMaelstrom: 'maokai/r',
        MasterYiAlphaStrike: 'masteryi/q',
        MasterYiDoubleStrike: 'masteryi/passive',
        MasterYiHighlander: 'masteryi/r',
        MasterYiMeditate: 'masteryi/w',
        MasterYiWujuStyle: 'masteryi/e',
        MissFortuneBulletTime: 'missfortune/r',
        MissFortuneDoubleUp: 'missfortune/q',
        MissFortuneImpureShots: 'missfortune/w',
        MissFortuneMakeItRain: 'missfortune/e',
        MissFortuneStrut: 'missfortune/passive',
        MonkeyKingCrushingBlow: 'monkeyking/q',
        MonkeyKingCyclone: 'monkeyking/r',
        MonkeyKingDecoy: 'monkeyking/w',
        MonkeyKingNimbusStrike: 'monkeyking/e',
        MonkeyKingStoneSkin: 'monkeyking/passive',
        MordekaiserChildrenoftheGrave: 'mordekaiser/r',
        MordekaiserCreepingDeath: 'mordekaiser/w',
        MordekaiserIronMan: 'mordekaiser/passive',
        MordekaiserMaceofSpades: 'mordekaiser/q',
        MordekaiserSiphonofDestruction: 'mordekaiser/e',
        MorganaBlackShield: 'morgana/e',
        MorganaDarkBinding: 'morgana/q',
        MorganaSoulShackles: 'morgana/r',
        MorganaSoulSiphon: 'morgana/passive',
        MorganaTormentedSoil: 'morgana/w',
        NamiAquaPrison: 'nami/q',
        NamiEbbandFlow: 'nami/w',
        NamiSurgingTides: 'nami/passive',
        NamiTidalWave: 'nami/r',
        NamiTidecallersBlessing: 'nami/e',
        NasusFuryoftheSands: 'nasus/r',
        NasusSiphoningStrike: 'nasus/q',
        NasusSoulEater: 'nasus/passive',
        NasusSpiritFire: 'nasus/e',
        NasusWither: 'nasus/w',
        NautilusDepthCharge: 'nautilus/r',
        NautilusDredgeLine: 'nautilus/q',
        NautilusRiptide: 'nautilus/e',
        NautilusStaggeringBlow: 'nautilus/passive',
        NautilusTitansWrath: 'nautilus/w',
        NidaleeAspectOfTheCougar: 'nidalee/r',
        NidaleeBushwhack: 'nidalee/w',
        NidaleeJavelinToss: 'nidalee/q',
        NidaleePounce: 'nidalee/w',
        NidaleePrimalSurge: 'nidalee/e',
        NidaleeProwl: 'nidalee/passive',
        NidaleeSwipe: 'nidalee/e',
        NidaleeTakedown: 'nidalee/q',
        NocturneDuskbringer: 'nocturne/q',
        NocturneParanoia: 'nocturne/r',
        NocturneShroudofDarkness: 'nocturne/w',
        NocturneUnspeakableHorror: 'nocturne/e',
        NunuAbsoluteZero: 'nunu/r',
        NunuBloodBoil: 'nunu/w',
        NunuConsume: 'nunu/q',
        NunuIceBlast: 'nunu/e',
        NunuVisionary: 'nunu/passive',
        OriannaAttack: 'orianna/q',
        OriannaClockworkWindup: 'orianna/passive',
        OriannaCommandAttack: 'orianna/q',
        OriannaCommandDissonance: 'orianna/w',
        OriannaCommandProtect: 'orianna/e',
        OriannaCommandShockwave: 'orianna/r',
        OriannaDissonance: 'orianna/w',
        OriannaProtect: 'orianna/e',
        OriannaShockwave: 'orianna/r',
        PantheonAegisofZeonia: 'pantheon/w',
        PantheonAegisProtection: 'pantheon/passive',
        PantheonGrandSkyfall: 'pantheon/r',
        PantheonHeartseekerStrike: 'pantheon/e',
        PantheonSpearShot: 'pantheon/q',
        PoppyDevastatingBlow: 'poppy/q',
        PoppyDiplomaticImmunity: 'poppy/r',
        PoppyHeroicCharge: 'poppy/e',
        PoppyParagonofDemacia: 'poppy/w',
        PoppyValiantFighter: 'poppy/passive',
        QuinnBlindingAssault: 'quinn/q',
        QuinnHarrier: 'quinn/passive',
        QuinnHeightenedSenses: 'quinn/w',
        QuinnTagTeam: 'quinn/r',
        QuinnVault: 'quinn/e',
        RammusDefensiveBallCurl: 'rammus/w',
        RammusPowerball: 'rammus/q',
        RammusPuncturingTaunt: 'rammus/e',
        RammusSpikedShell: 'rammus/passive',
        RammusTremors: 'rammus/r',
        RenektonCulltheMeek: 'renekton/q',
        RenektonDominus: 'renekton/r',
        RenektonReignofAnger: 'renekton/passive',
        RenektonRuthlessPredator: 'renekton/w',
        RenektonSliceandDice: 'renekton/e',
        RengarBattleRoar: 'rengar/w',
        RengarBolaStrike: 'rengar/e',
        RengarSavagery: 'rengar/q',
        RengarThrilloftheHunt: 'rengar/r',
        RengarUnseenPredator: 'rengar/passive',
        RivenBladeoftheExile: 'riven/r',
        RivenBrokenWings: 'riven/q',
        RivenKiBurst: 'riven/w',
        RivenValor: 'riven/e',
        RumbleElectroHarpoon: 'rumble/e',
        RumbleFlamespitter: 'rumble/q',
        RumbleJunkyardTitan: 'rumble/passive',
        RumbleScrapShield: 'rumble/w',
        RumbleTheEqualizer: 'rumble/r',
        RyzeArcaneMastery: 'ryze/passive',
        RyzeDesperatePower: 'ryze/r',
        RyzeOverload: 'ryze/q',
        RyzeRunePrison: 'ryze/w',
        RyzeSpellFlux: 'ryze/e',
        SejuaniArcticAssault: 'sejuani/q',
        SejuaniFlailoftheNorthernWinds: 'sejuani/w',
        SejuaniFrost: 'sejuani/passive',
        SejuaniGlacialPrison: 'sejuani/r',
        SejuaniPermafrost: 'sejuani/e',
        ShacoBackstab: 'shaco/passive',
        ShacoDeceive: 'shaco/q',
        ShacoHallucinate: 'shaco/r',
        ShacoJackInTheBox: 'shaco/w',
        ShacoTwoShivPoison: 'shaco/e',
        ShenFeint: 'shen/w',
        ShenKiStrike: 'shen/passive',
        ShenShadowDash: 'shen/e',
        ShenStandUnited: 'shen/r',
        ShenVorpalBlade: 'shen/q',
        ShyvanaBurnout: 'shyvana/w',
        ShyvanaDragonsDescent: 'shyvana/r',
        ShyvanaDragonborn: 'shyvana/passive',
        ShyvanaFlameBreath: 'shyvana/e',
        ShyvanaTwinBite: 'shyvana/q',
        SingedEmpoweredBulwark: 'singed/passive',
        SingedFling: 'singed/e',
        SingedInsanityPotion: 'singed/r',
        SingedMegaAdhesive: 'singed/w',
        SingedPoisonTrail: 'singed/q',
        SionCannibalism: 'sion/r',
        SionCrypticGaze: 'sion/q',
        SionDeathsCaress: 'sion/w',
        SionEnrage: 'sion/e',
        SionFeelNoPain: 'sion/passive',
        SivirBoomerangBlade: 'sivir/q',
        SivirFleetofFoot: 'sivir/passive',
        SivirOnTheHunt: 'sivir/r',
        SivirRicochet: 'sivir/w',
        SivirSpellShield: 'sivir/e',
        SkarnerCrystallineExoskeleton: 'skarner/w',
        SkarnerCrystalSlash: 'skarner/q',
        SkarnerEnergize: 'skarner/passive',
        SkarnerFracture: 'skarner/e',
        SkarnerImpale: 'skarner/r',
        SonaAriaofPerseverance: 'sona/w',
        SonaCrescendo: 'sona/r',
        SonaHymnofValor: 'sona/q',
        SonaPowerChord: 'sona/passive',
        SonaSongofCelerity: 'sona/e',
        SorakaAstralBlessing: 'soraka/w',
        SorakaInfuse: 'soraka/e',
        SorakaSalvation: 'soraka/passive',
        SorakaStarcall: 'soraka/q',
        SorakaWish: 'soraka/r',
        SwainCarrionRenewal: 'swain/passive',
        SwainDecrepify: 'swain/q',
        SwainNevermove: 'swain/w',
        SwainRavenousFlock: 'swain/r',
        SwainTorment: 'swain/e',
        SyndraDarkSphere: 'syndra/q',
        SyndraForceofWill: 'syndra/w',
        SyndraScattertheWeak: 'syndra/e',
        SyndraTranscendent: 'syndra/passive',
        SyndraUnleashedPower: 'syndra/r',
        TalonCutthroat: 'talon/e',
        TalonNoxianDiplomacy: 'talon/q',
        TalonRake: 'talon/w',
        TalonShadowAssault: 'talon/r',
        TaricDazzle: 'taric/e',
        TaricGemcraft: 'taric/passive',
        TaricImbue: 'taric/q',
        TaricRadiance: 'taric/r',
        TaricShatter: 'taric/w',
        TeemoBlindingDart: 'teemo/q',
        TeemoCamouflage: 'teemo/passive',
        TeemoMoveQuick: 'teemo/w',
        TeemoNoxiousTrap: 'teemo/r',
        TeemoToxicShot: 'teemo/e',
        ThreshDamnation: 'thresh/passive',
        ThreshDarkPassage: 'thresh/w',
        ThreshDeathSentence: 'thresh/q',
        ThreshFlay: 'thresh/e',
        ThreshTheBox: 'thresh/r',
        TristanaBusterShot: 'tristana/r',
        TristanaDrawaBead: 'tristana/passive',
        TristanaExplosiveShot: 'tristana/e',
        TristanaRapidFire: 'tristana/q',
        TristanaRocketJump: 'tristana/w',
        TrundleChomp: 'trundle/q',
        TrundleFrozenDomain: 'trundle/w',
        TrundleKingsTribute: 'trundle/passive',
        TrundlePillarofIce: 'trundle/e',
        TrundleSubjugate: 'trundle/r',
        TryndamereBattleFury: 'tryndamere/passive',
        TryndamereBloodlust: 'tryndamere/q',
        TryndamereMockingShout: 'tryndamere/w',
        TryndamereSpinningSlash: 'tryndamere/e',
        TryndamereUndyingRage: 'tryndamere/r',
        TwitchAmbush: 'twitch/q',
        TwitchDeadlyVenom: 'twitch/passive',
        TwitchExpunge: 'twitch/e',
        TwitchSprayandPray: 'twitch/r',
        TwitchVenomCask: 'twitch/w',
        UdyrBearStance: 'udyr/e',
        UdyrMonkeysAgility: 'udyr/passive',
        UdyrPhoenixStance: 'udyr/r',
        UdyrTigerStance: 'udyr/q',
        UdyrTurtleStance: 'udyr/w',
        VarusBlightedQuiver: 'varus/w',
        VarusChainofCorruption: 'varus/r',
        VarusHailofArrows: 'varus/e',
        VarusLivingVengeance: 'varus/passive',
        VarusPiercingArrow: 'varus/q',
        VayneCondemn: 'vayne/e',
        VayneFinalHour: 'vayne/r',
        VayneNightHunter: 'vayne/passive',
        VayneSilverBolts: 'vayne/w',
        VayneTumble: 'vayne/q',
        VeigarBalefulStrike: 'veigar/q',
        VeigarDarkMatter: 'veigar/w',
        VeigarEquilibrium: 'veigar/passive',
        VeigarEventHorizon: 'veigar/e',
        VeigarPrimordialBurst: 'veigar/r',
        VelkozLifeFormDisintegrationRay: 'velkoz/r',
        VelkozOrganicDeconstruction: 'velkoz/passive',
        VelkozPlasmaFission: 'velkoz/q',
        VelkozTectonicDisruption: 'velkoz/e',
        VelkozVoidRift: 'velkoz/w',
        ViAssaultandBattery: 'vi/r',
        ViBlastShield: 'vi/passive',
        ViDentingBlows: 'vi/w',
        ViExcessiveForce: 'vi/e',
        ViktorChaosStorm: 'viktor/r',
        ViktorDeathRay: 'viktor/e',
        ViktorEvolvingTechnology: 'viktor/passive',
        ViktorGravityField: 'viktor/w',
        ViktorPowerTransfer: 'viktor/q',
        ViVaultBreaker: 'vi/q',
        VladimirHemoplague: 'vladimir/r',
        VladimirSanguinePool: 'vladimir/w',
        VladimirTidesofBlood: 'vladimir/e',
        VladimirTransfusion: 'vladimir/q',
        VolibearChosenoftheStorm: 'volibear/passive',
        VolibearFrenzy: 'volibear/w',
        VolibearMajesticRoar: 'volibear/e',
        VolibearRollingThunder: 'volibear/q',
        VolibearThunderClaws: 'volibear/r',
        WarwickBloodScent: 'warwick/e',
        WarwickEternalThirst: 'warwick/passive',
        WarwickHungeringStrike: 'warwick/q',
        WarwickHuntersCall: 'warwick/w',
        WarwickInfiniteDuress: 'warwick/r',
        XerathArcanopulse: 'xerath/q',
        XerathEyeofDestruction: 'xerath/w',
        XerathManaSurge: 'xerath/passive',
        XerathRiteoftheArcane: 'xerath/r',
        XerathShockingOrb: 'xerath/e',
        YasuoLastBreath: 'yasuo/r',
        YasuoSteelTempest: 'yasuo/q',
        YasuoSweepingBlade: 'yasuo/e',
        YasuoWayoftheWanderer: 'yasuo/passive',
        YasuoWindWall: 'yasuo/w',
        YorickOmenofDeath: 'yorick/r',
        YorickOmenofFamine: 'yorick/e',
        YorickOmenofPestilence: 'yorick/w',
        YorickOmenofWar: 'yorick/q',
        YorickUnholyCovenant: 'yorick/passive',
        ZacCellDivision: 'zac/passive',
        ZacElasticSlingshot: 'zac/e',
        ZacLetsBounce: 'zac/r',
        ZacStretchingStrike: 'zac/q',
        ZacUnstableMatter: 'zac/w',
        ZedContemptfortheWeak: 'zed/passive',
        ZedDeathMark: 'zed/r',
        ZedLivingShadow: 'zed/w',
        ZedRazorShuriken: 'zed/q',
        ZedShadowSlash: 'zed/e',
        ZiggsBouncingBomb: 'ziggs/q',
        ZiggsHexplosiveMinefield: 'ziggs/e',
        ZiggsMegaInfernoBomb: 'ziggs/r',
        ZiggsSatchelCharge: 'ziggs/w',
        ZiggsShortFuse: 'ziggs/passive',
        ZileanChronoshift: 'zilean/r',
        ZileanHeightenedLearning: 'zilean/passive',
        ZileanRewind: 'zilean/w',
        ZileanTimeBomb: 'zilean/q',
        ZileanTimeWarp: 'zilean/e',
        ZyraDeadlyBloom: 'zyra/q',
        ZyraGraspingRoots: 'zyra/e',
        ZyraRampantGrowth: 'zyra/w',
        ZyraRiseoftheThorns: 'zyra/passive',
        ZyraStranglethorns: 'zyra/r'
    },
    Item: {
        BootsOfSpeed: 1001,
        FaerieCharm: 1004,
        RejuvenationBead: 1006,
        GiantsBelt: 1011,
        CloakOfAgility: 1018,
        BlastingWand: 1026,
        SapphireCrystal: 1027,
        RubyCrystal: 1028,
        ClothArmor: 1029,
        ChainVest: 1031,
        NullMagicMantle: 1033,
        LongSword: 1036,
        Pickaxe: 1037,
        BFSword: 1038,
        HuntersMachete: 1039,
        Dagger: 1042,
        RecurveBow: 1043,
        BrawlersGloves: 1051,
        AmplifyingTome: 1052,
        VampiricScepter: 1053,
        DoransShield: 1054,
        DoransBlade: 1055,
        DoransRing: 1056,
        NegatronCloak: 1057,
        NeedlesslyLargeRod: 1058,
        ProspectorsBlade: 1062,
        ProspectorsRing: 1063,
        SpiritStone: 1080,
        HealthPotion: 2003,
        ManaPotion: 2004,
        TotalBiscuitOfRejuvenation: 2009,
        ElixirOfFortitude: 2037,
        ElixirOfBrilliance: 2039,
        IchorOfRage: 2040,
        CrystallineFlask: 2041,
        OraclesElixir: 2042,
        VisionWard: 2043,
        StealthWard: 2044,
        RubySightstone: 2045,
        OraclesExtract: 2047,
        IchorOfIllumination: 2048,
        Sightstone: 2049,
        ExplorersWard: 2050,
        GuardiansHorn: 2051,
        PoroSnax: 2052,
        AbyssalScepter: 3001,
        ArchangelsStaff: 3003,
        Manamune: 3004,
        AtmasImpaler: 3005,
        BerserkersGreaves: 3006,
        BootsOfSwiftness: 3009,
        CatalysttheProtector: 3010,
        SorcerersShoes: 3020,
        FrozenMallet: 3022,
        TwinShadows: 3023,
        GlacialShroud: 3024,
        IcebornGauntlet: 3025,
        GuardianAngel: 3026,
        RodOfAges: 3027,
        ChaliceOfHarmony: 3028,
        InfinityEdge: 3031,
        LastWhisper: 3035,
        ManaManipulator: 3037,
        SeraphsEmbrace: 3040,
        MejaisSoulstealer: 3041,
        Muramana: 3042,
        Phage: 3044,
        PhantomDancer: 3046,
        NinjaTabi: 3047,
        ZekesHerald: 3050,
        Ohmwrecker: 3056,
        Sheen: 3057,
        BannerOfCommand: 3060,
        SpiritVisage: 3065,
        Kindlegem: 3067,
        SunfireCape: 3068,
        TalismanOfAscension: 3069,
        TearOftheGoddess: 3070,
        TheBlackCleaver: 3071,
        TheBloodthirster: 3072,
        RavenousHydra: 3074,
        Thornmail: 3075,
        Tiamat: 3077,
        TrinityForce: 3078,
        WardensMail: 3082,
        WarmogsArmor: 3083,
        OverlordsBloodmail: 3084,
        RunaansHurricane: 3085,
        Zeal: 3086,
        StatikkShiv: 3087,
        RabadonsDeathcap: 3089,
        WoogletsWitchcap: 3090,
        WitsEnd: 3091,
        FrostQueensClaim: 3092,
        AvariceBlade: 3093,
        NomadsMedallion: 3096,
        TargonsBrace: 3097,
        Frostfang: 3098,
        LichBane: 3100,
        Stinger: 3101,
        BansheesVeil: 3102,
        AegisOftheLegion: 3105,
        MadredsRazors: 3106,
        FiendishCodex: 3108,
        FrozenHeart: 3110,
        MercurysTreads: 3111,
        OrbOfWinter: 3112,
        NashorsTooth: 3115,
        RylaisCrystalScepter: 3116,
        BootsOfMobility: 3117,
        ExecutionersCalling: 3123,
        GuinsoosRageblade: 3124,
        DeathfireGrasp: 3128,
        SwordOftheDivine: 3131,
        TheBrutalizer: 3134,
        VoidStaff: 3135,
        HauntingGuise: 3136,
        MercurialScimitar: 3139,
        QuicksilverSash: 3140,
        SwordOftheOccult: 3141,
        YoumuusGhostblade: 3142,
        RanduinsOmen: 3143,
        BilgewaterCutlass: 3144,
        HextechRevolver: 3145,
        HextechGunblade: 3146,
        LiandrysTorment: 3151,
        WillOftheAncients: 3152,
        BladeOftheRuinedKing: 3153,
        WrigglesLantern: 3154,
        Hexdrinker: 3155,
        MawOfMalmortius: 3156,
        ZhonyasHourglass: 3157,
        IonianBootsOfLucidity: 3158,
        GrezsSpectralLantern: 3159,
        Morellonomicon: 3165,
        BonetoothNecklace: 3166,
        MoonflairSpellblade: 3170,
        Zephyr: 3172,
        EleisasMiracle: 3173,
        AthenesUnholyGrail: 3174,
        HeadOfKhaZix: 3175,
        OdynsVeil: 3180,
        SanguineBlade: 3181,
        Entropy: 3184,
        TheLightbringer: 3185,
        KitaesBloodrazor: 3186,
        HextechSweeper: 3187,
        BlackfireTorch: 3188,
        LocketOftheIronSolari: 3190,
        SeekersArmguard: 3191,
        AugmentPower: 3196,
        AugmentGravity: 3197,
        AugmentDeath: 3198,
        TheHexCore: 3200,
        SpiritOftheSpectralWraith: 3206,
        SpiritOftheAncientGolem: 3207,
        SpiritOftheElderLizard: 3209,
        SpectresCowl: 3211,
        MikaelsCrucible: 3222,
        EnchantmentHomeguard: 3250,
        EnchantmentCaptain: 3251,
        EnchantmentFuror: 3252,
        EnchantmentDistortion: 3253,
        EnchantmentAlacrity: 3254,
        AncientCoin: 3301,
        RelicShield: 3302,
        SpellthiefsEdge: 3303,
        WardingTotem: 3340,
        SweepingLens: 3341,
        ScryingOrb: 3342,
        GreaterTotem: 3350,
        GreaterLens: 3351,
        GreaterOrb: 3352,
        GreaterStealthTotem: 3361,
        GreaterVisionTotem: 3362,
        FarsightOrb: 3363,
        OraclesLens: 3364,
        FaceOftheMountain: 3401,
        LordVanDammsPillager: 3104,
        WickedHatchet: 3122,
        DervishBlade: 3137
    },
    Mastery: {
        DoubleEdgedSword: 4111,
        Fury: 4112,
        Sorcery: 4113,
        Butcher: 4114,
        ExposeWeakness: 4121,
        BruteForce: 4122,
        MentalForce: 4123,
        Feast: 4124,
        SpellWeaving: 4131,
        MartialMastery: 4132,
        ArcaneMastery: 4133,
        Executioner: 4134,
        BladeWeaving: 4141,
        Warlord: 4142,
        Archmage: 4143,
        DangerousGame: 4144,
        Frenzy: 4151,
        DevastatingStrikes: 4152,
        ArcaneBlade: 4154,
        Havoc: 4162,
        Block: 4211,
        Recovery: 4212,
        EnchantedArmor: 4213,
        ToughSkin: 4214,
        Unyielding: 4221,
        VeteransScars: 4222,
        BladedArmor: 4224,
        Oppression: 4231,
        Juggernaut: 4232,
        Hardiness: 4233,
        Resistance: 4234,
        Perseverance: 4241,
        Swiftness: 4242,
        ReinforcedArmor: 4243,
        Evasive: 4244,
        SecondWind: 4251,
        LegendaryGuardian: 4252,
        RunicBlessing: 4253,
        Tenacious: 4262,
        Phasewalker: 4311,
        FleetofFoot: 4312,
        Meditation: 4313,
        Scout: 4314,
        SummonersInsight: 4322,
        StrengthofSpirit: 4323,
        Alchemist: 4324,
        Greed: 4331,
        RunicAffinity: 4332,
        Vampirism: 4333,
        CulinaryMaster: 4334,
        Scavenger: 4341,
        Wealth: 4342,
        ExpandedMind: 4343,
        Inspiration: 4344,
        Bandit: 4352,
        Intelligence: 4353,
        Wanderer: 4362
    },
    Rune: {
        RazerMarkofPrecision: 10001,
        RazerQuintessenceofSpeed: 10002,
        LesserMarkofAttackDamage: 5001,
        LesserMarkofScalingAttackDamage: 5002,
        LesserMarkofAttackSpeed: 5003,
        LesserMarkofCriticalDamage: 5005,
        LesserMarkofCriticalChance: 5007,
        LesserMarkofArmorPenetration: 5009,
        LesserMarkofHealth: 5011,
        LesserMarkofScalingHealth: 5012,
        LesserMarkofArmor: 5013,
        LesserMarkofMagicResist: 5015,
        LesserMarkofScalingMagicResist: 5016,
        LesserMarkofCooldownReduction: 5021,
        LesserMarkofAbilityPower: 5023,
        LesserMarkofScalingAbilityPower: 5024,
        LesserMarkofMana: 5025,
        LesserMarkofScalingMana: 5026,
        LesserMarkofManaRegeneration: 5027,
        LesserMarkofMagicPenetration: 5029,
        LesserGlyphofAttackDamage: 5031,
        LesserGlyphofScalingAttackDamage: 5032,
        LesserGlyphofAttackSpeed: 5033,
        LesserGlyphofCriticalDamage: 5035,
        LesserGlyphofCriticalChance: 5037,
        LesserGlyphofHealth: 5041,
        LesserGlyphofScalingHealth: 5042,
        LesserGlyphofArmor: 5043,
        LesserGlyphofMagicResist: 5045,
        LesserGlyphofScalingMagicResist: 5046,
        LesserGlyphofHealthRegeneration: 5047,
        LesserGlyphofCooldownReduction: 5051,
        LesserGlyphofScalingCooldownReduction: 5052,
        LesserGlyphofAbilityPower: 5053,
        LesserGlyphofScalingAbilityPower: 5054,
        LesserGlyphofMana: 5055,
        LesserGlyphofScalingMana: 5056,
        LesserGlyphofManaRegeneration: 5057,
        LesserGlyphofScalingManaRegeneration: 5058,
        LesserGlyphofMagicPenetration: 5059,
        LesserSealofAttackDamage: 5061,
        LesserSealofScalingAttackDamage: 5062,
        LesserSealofAttackSpeed: 5063,
        LesserSealofCriticalDamage: 5065,
        LesserSealofCriticalChance: 5067,
        LesserSealofHealth: 5071,
        LesserSealofScalingHealth: 5072,
        LesserSealofArmor: 5073,
        LesserSealofScalingArmor: 5074,
        LesserSealofMagicResist: 5075,
        LesserSealofScalingMagicResist: 5076,
        LesserSealofHealthRegeneration: 5077,
        LesserSealofScalingHealthRegeneration: 5078,
        LesserSealofCooldownReduction: 5081,
        LesserSealofAbilityPower: 5083,
        LesserSealofScalingAbilityPower: 5084,
        LesserSealofMana: 5085,
        LesserSealofScalingMana: 5086,
        LesserSealofManaRegeneration: 5087,
        LesserSealofScalingManaRegeneration: 5088,
        LesserQuintessenceofAttackDamage: 5091,
        LesserQuintessenceofScalingAttackDamage: 5092,
        LesserQuintessenceofAttackSpeed: 5093,
        LesserQuintessenceofCriticalDamage: 5095,
        LesserQuintessenceofCriticalChance: 5097,
        LesserQuintessenceofArmorPenetration: 5099,
        LesserQuintessenceofHealth: 5101,
        LesserQuintessenceofScalingHealth: 5102,
        LesserQuintessenceofArmor: 5103,
        LesserQuintessenceofScalingArmor: 5104,
        LesserQuintessenceofMagicResist: 5105,
        LesserQuintessenceofScalingMagicResist: 5106,
        LesserQuintessenceofHealthRegeneration: 5107,
        LesserQuintessenceofScalingHealthRegeneration: 5108,
        LesserQuintessenceofCooldownReduction: 5111,
        LesserQuintessenceofScalingCooldownReduction: 5112,
        LesserQuintessenceofAbilityPower: 5113,
        LesserQuintessenceofScalingAbilityPower: 5114,
        LesserQuintessenceofMana: 5115,
        LesserQuintessenceofScalingMana: 5116,
        LesserQuintessenceofManaRegeneration: 5117,
        LesserQuintessenceofScalingManaRegeneration: 5118,
        LesserQuintessenceofMagicPenetration: 5119,
        LesserQuintessenceofMovementSpeed: 5121,
        MarkofAttackDamage: 5123,
        MarkofScalingAttackDamage: 5124,
        MarkofAttackSpeed: 5125,
        MarkofCriticalDamage: 5127,
        MarkofCriticalChance: 5129,
        MarkofArmorPenetration: 5131,
        MarkofHealth: 5133,
        MarkofScalingHealth: 5134,
        MarkofArmor: 5135,
        MarkofMagicResist: 5137,
        MarkofScalingMagicResist: 5138,
        MarkofCooldownReduction: 5143,
        MarkofAbilityPower: 5145,
        MarkofScalingAbilityPower: 5146,
        MarkofMana: 5147,
        MarkofScalingMana: 5148,
        MarkofManaRegeneration: 5149,
        MarkofMagicPenetration: 5151,
        GlyphofAttackDamage: 5153,
        GlyphofScalingAttackDamage: 5154,
        GlyphofAttackSpeed: 5155,
        GlyphofCriticalDamage: 5157,
        GlyphofCriticalChance: 5159,
        GlyphofHealth: 5163,
        GlyphofScalingHealth: 5164,
        GlyphofArmor: 5165,
        GlyphofMagicResist: 5167,
        GlyphofScalingMagicResist: 5168,
        GlyphofHealthRegeneration: 5169,
        GlyphofCooldownReduction: 5173,
        GlyphofScalingCooldownReduction: 5174,
        GlyphofAbilityPower: 5175,
        GlyphofScalingAbilityPower: 5176,
        GlyphofMana: 5177,
        GlyphofScalingMana: 5178,
        GlyphofManaRegeneration: 5179,
        GlyphofScalingManaRegeneration: 5180,
        GlyphofMagicPenetration: 5181,
        SealofAttackDamage: 5183,
        SealofScalingAttackDamage: 5184,
        SealofAttackSpeed: 5185,
        SealofCriticalDamage: 5187,
        SealofCriticalChance: 5189,
        SealofHealth: 5193,
        SealofScalingHealth: 5194,
        SealofArmor: 5195,
        SealofScalingArmor: 5196,
        SealofMagicResist: 5197,
        SealofScalingMagicResist: 5198,
        SealofHealthRegeneration: 5199,
        SealofScalingHealthRegeneration: 5200,
        SealofCooldownReduction: 5203,
        SealofAbilityPower: 5205,
        SealofScalingAbilityPower: 5206,
        SealofMana: 5207,
        SealofScalingMana: 5208,
        SealofManaRegeneration: 5209,
        SealofScalingManaRegeneration: 5210,
        QuintessenceofAttackDamage: 5213,
        QuintessenceofScalingAttackDamage: 5214,
        QuintessenceofAttackSpeed: 5215,
        QuintessenceofCriticalDamage: 5217,
        QuintessenceofCriticalChance: 5219,
        QuintessenceofArmorPenetration: 5221,
        QuintessenceofHealth: 5223,
        QuintessenceofScalingHealth: 5224,
        QuintessenceofArmor: 5225,
        QuintessenceofScalingArmor: 5226,
        QuintessenceofMagicResist: 5227,
        QuintessenceofScalingMagicResist: 5228,
        QuintessenceofHealthRegeneration: 5229,
        QuintessenceofScalingHealthRegeneration: 5230,
        QuintessenceofCooldownReduction: 5233,
        QuintessenceofScalingCooldownReduction: 5234,
        QuintessenceofAbilityPower: 5235,
        QuintessenceofScalingAbilityPower: 5236,
        QuintessenceofMana: 5237,
        QuintessenceofScalingMana: 5238,
        QuintessenceofManaRegeneration: 5239,
        QuintessenceofScalingManaRegeneration: 5240,
        QuintessenceofMagicPenetration: 5241,
        QuintessenceofMovementSpeed: 5243,
        GreaterMarkofAttackDamage: 5245,
        GreaterMarkofScalingAttackDamage: 5246,
        GreaterMarkofAttackSpeed: 5247,
        GreaterMarkofCriticalDamage: 5249,
        GreaterMarkofCriticalChance: 5251,
        GreaterMarkofArmorPenetration: 5253,
        GreaterMarkofHealth: 5255,
        GreaterMarkofScalingHealth: 5256,
        GreaterMarkofArmor: 5257,
        GreaterMarkofMagicResist: 5259,
        GreaterMarkofScalingMagicResist: 5260,
        GreaterMarkofCooldownReduction: 5265,
        GreaterMarkofAbilityPower: 5267,
        GreaterMarkofScalingAbilityPower: 5268,
        GreaterMarkofMana: 5269,
        GreaterMarkofScalingMana: 5270,
        GreaterMarkofManaRegeneration: 5271,
        GreaterMarkofMagicPenetration: 5273,
        GreaterGlyphofAttackDamage: 5275,
        GreaterGlyphofScalingAttackDamage: 5276,
        GreaterGlyphofAttackSpeed: 5277,
        GreaterGlyphofCriticalDamage: 5279,
        GreaterGlyphofCriticalChance: 5281,
        GreaterGlyphofHealth: 5285,
        GreaterGlyphofScalingHealth: 5286,
        GreaterGlyphofArmor: 5287,
        GreaterGlyphofMagicResist: 5289,
        GreaterGlyphofScalingMagicResist: 5290,
        GreaterGlyphofHealthRegeneration: 5291,
        GreaterGlyphofCooldownReduction: 5295,
        GreaterGlyphofScalingCooldownReduction: 5296,
        GreaterGlyphofAbilityPower: 5297,
        GreaterGlyphofScalingAbilityPower: 5298,
        GreaterGlyphofMana: 5299,
        GreaterGlyphofScalingMana: 5300,
        GreaterGlyphofManaRegeneration: 5301,
        GreaterGlyphofScalingManaRegeneration: 5302,
        GreaterGlyphofMagicPenetration: 5303,
        GreaterSealofAttackDamage: 5305,
        GreaterSealofScalingAttackDamage: 5306,
        GreaterSealofAttackSpeed: 5307,
        GreaterSealofCriticalDamage: 5309,
        GreaterSealofCriticalChance: 5311,
        GreaterSealofHealth: 5315,
        GreaterSealofScalingHealth: 5316,
        GreaterSealofArmor: 5317,
        GreaterSealofScalingArmor: 5318,
        GreaterSealofMagicResist: 5319,
        GreaterSealofScalingMagicResist: 5320,
        GreaterSealofHealthRegeneration: 5321,
        GreaterSealofScalingHealthRegeneration: 5322,
        GreaterSealofCooldownReduction: 5325,
        GreaterSealofAbilityPower: 5327,
        GreaterSealofScalingAbilityPower: 5328,
        GreaterSealofMana: 5329,
        GreaterSealofScalingMana: 5330,
        GreaterSealofManaRegeneration: 5331,
        GreaterSealofScalingManaRegeneration: 5332,
        GreaterQuintessenceofAttackDamage: 5335,
        GreaterQuintessenceofScalingAttackDamage: 5336,
        GreaterQuintessenceofAttackSpeed: 5337,
        GreaterQuintessenceofCriticalDamage: 5339,
        GreaterQuintessenceofCriticalChance: 5341,
        GreaterQuintessenceofArmorPenetration: 5343,
        GreaterQuintessenceofHealth: 5345,
        GreaterQuintessenceofScalingHealth: 5346,
        GreaterQuintessenceofArmor: 5347,
        GreaterQuintessenceofScalingArmor: 5348,
        GreaterQuintessenceofMagicResist: 5349,
        GreaterQuintessenceofScalingMagicResist: 5350,
        GreaterQuintessenceofHealthRegeneration: 5351,
        GreaterQuintessenceofScalingHealthRegeneration: 5352,
        GreaterQuintessenceofCooldownReduction: 5355,
        GreaterQuintessenceofScalingCooldownReduction: 5356,
        GreaterQuintessenceofAbilityPower: 5357,
        GreaterQuintessenceofScalingAbilityPower: 5358,
        GreaterQuintessenceofMana: 5359,
        GreaterQuintessenceofScalingMana: 5360,
        GreaterQuintessenceofManaRegeneration: 5361,
        GreaterQuintessenceofScalingManaRegeneration: 5362,
        GreaterQuintessenceofMagicPenetration: 5363,
        GreaterQuintessenceofMovementSpeed: 5365,
        GreaterQuintessenceofRevival: 5366,
        GreaterQuintessenceofGold: 5367,
        GreaterQuintessenceofExperience: 5368,
        GreaterSealofEnergyRegeneration: 5369,
        GreaterSealofScalingEnergyRegeneration: 5370,
        GreaterGlyphofEnergy: 5371,
        GreaterGlyphofScalingEnergy: 5372,
        GreaterQuintessenceofEnergyRegeneration: 5373,
        GreaterQuintessenceofEnergy: 5374,
        LesserMarkofHybridPenetration: 5400,
        MarkofHybridPenetration: 5401,
        GreaterMarkofHybridPenetration: 5402,
        GreaterSealofGold: 5403,
        LesserQuintessenceofPercentHealth: 5404,
        QuintessenceofPercentHealth: 5405,
        GreaterQuintessenceofPercentHealth: 5406,
        LesserQuintessenceofSpellVamp: 5407,
        QuintessenceofSpellVamp: 5408,
        GreaterQuintessenceofSpellVamp: 5409,
        LesserQuintessenceofLifeSteal: 5410,
        QuintessenceofLifeSteal: 5411,
        GreaterQuintessenceofLifeSteal: 5412,
        LesserSealofPercentHealth: 5413,
        SealofPercentHealth: 5414,
        GreaterSealofPercentHealth: 5415,
        LesserQuintessenceofHybridPenetration: 5416,
        QuintessenceofHybridPenetration: 5417,
        GreaterQuintessenceofHybridPenetration: 5418,
        MarkoftheCripplingCandyCane: 8001,
        LesserMarkoftheYuletideTannenbaum: 8002,
        GlyphoftheSpecialStocking: 8003,
        LesserGlyphoftheGraciousGift: 8005,
        LesserSealoftheStoutSnowman: 8006,
        LesserMarkofAlpineAttackSpeed: 8007,
        MarkoftheCombatant: 8008,
        LesserSealoftheMedalist: 8009,
        LesserGlyphoftheChallenger: 8011,
        GlyphoftheSoaringSlalom: 8012,
        QuintessenceoftheHeadlessHorseman: 8013,
        QuintessenceofthePiercingScreech: 8014,
        QuintessenceofBountifulTreats: 8015,
        QuintessenceoftheSpeedySpecter: 8016,
        QuintessenceoftheWitchesBrew: 8017,
        GreaterQuintessenceofthePiercingPresent: 8019,
        GreaterQuintessenceoftheDeadlyWreath: 8020,
        GreaterQuintessenceofFrostyHealth: 8021,
        GreaterQuintessenceofSugarRush: 8022,
        GreaterQuintessenceofStudioRumble: 8035
    },
    Spell: {
        Barrier: 21,
        Surge: 16,
        Cleanse: 1,
        Clairvoyance: 2,
        Ignite: 14,
        Exhaust: 3,
        Flash: 4,
        Fortify: 5,
        Ghost: 6,
        Heal: 7,
        Clarity: 13,
        Garrison: 17,
        Promote: 20,
        Rally: 9,
        Revive: 10,
        Smite: 11,
        Teleport: 12
    },

    util: {

        findById: function (collection, id) {
            var found;
            jQuery.each(eval(collection), function (key, element) {
                if (!found && element == id) found = (collection + '.' + key);
            });
            return found;
        },

        findByKey: function (collection, string) {

            toFind = string.toLowerCase().replace(/[\._\s\-\\/]/g, "");
            var found;
            jQuery.each(eval(collection), function (key, element) {
                if (!found && key.toLowerCase() === toFind) found = (collection + '.' + key);
            });
            return found;
        }
    }
});/*
 t.js a micro-templating framework in ~400 bytes gzipped
 https://github.com/jasonmoo/t.js
 @author  Jason Mooberry <jasonmoo@me.com> @license MIT @version 0.1.0
 */
(function () {
    var blockregex = /\{\{(([@!]?)(.+?))\}\}(([\s\S]+?)(\{\{:\1\}\}([\s\S]+?))?)\{\{\/\1\}\}/g, valregex = /\{\{([=%])(.+?)\}\}/g;

    function t(template) {
        this.t = template;
    }

    function scrub(val) {
        return new Option(val).innerHTML.replace(/"/g, "&quot;");
    }

    function get_value(vars, key) {
        var parts = key.split('.');
        while (parts.length) {
            if (!(parts[0] in vars)) {
                return false;
            }
            vars = vars[parts.shift()];
        }
        return vars;
    }

    function render(fragment, vars) {
        return fragment
            .replace(blockregex, function (_, __, meta, key, inner, if_true, has_else, if_false) {
                var val = get_value(vars, key), temp = "", i;
                if (!val) {
                    if (meta == '!') return render(inner, vars);
                    if (has_else) return render(if_false, vars);
                    return "";
                }
                if (!meta) return render(if_true, vars);
                if (meta == '@') {
                    // store any previous vars
                    // reuse existing vars
                    _ = vars._key;
                    __ = vars._val;
                    for (i in val) {
                        if (val.hasOwnProperty(i)) {
                            vars._key = i;
                            vars._val = val[i];
                            temp += render(inner, vars);
                        }
                    }
                    vars._key = _;
                    vars._val = __;
                    return temp;
                }

            })
            .replace(valregex, function (_, meta, key) {
                var val = get_value(vars, key);
                if (val || val === 0) {
                    return meta == '%' ? scrub(val) : val;
                }
                return "";
            });
    }

    t.prototype.render = function (vars) {
        return render(this.t, vars);
    };
    window.t = t;
})();
/*!
 * imagesReady PACKAGED v3.1.8
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */


/*!
 * EventEmitter v4.2.6 - git.io/ee
 * Oliver Caldwell
 * MIT license
 * @preserve
 */

(function () {


    /**
     * Class for managing events.
     * Can be extended to provide event functionality in other classes.
     *
     * @class EventEmitter Manages event registering and emitting.
     */
    function EventEmitter() {}

    // Shortcuts to improve speed and size
    var proto = EventEmitter.prototype;
    var exports = this;
    var originalGlobalValue = exports.EventEmitter;

    /**
     * Finds the index of the listener for the event in it's storage array.
     *
     * @param {Function[]} listeners Array of listeners to search through.
     * @param {Function} listener Method to look for.
     * @return {Number} Index of the specified listener, -1 if not found
     * @api private
     */
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Alias a method while keeping the context correct, to allow for overwriting of target method.
     *
     * @param {String} name The name of the target method.
     * @return {Function} The aliased method
     * @api private
     */
    function alias(name) {
        return function aliasClosure() {
            return this[name].apply(this, arguments);
        };
    }

    /**
     * Returns the listener array for the specified event.
     * Will initialise the event object and listener arrays if required.
     * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
     * Each property in the object response is an array of listener functions.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Function[]|Object} All listener functions for the event.
     */
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;

        // Return a concatenated array of all matching events if
        // the selector is a regular expression.
        if (typeof evt === 'object') {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        }
        else {
            response = events[evt] || (events[evt] = []);
        }

        return response;
    };

    /**
     * Takes a list of listener objects and flattens it into a list of listener functions.
     *
     * @param {Object[]} listeners Raw listener objects.
     * @return {Function[]} Just the listener functions.
     */
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;

        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }

        return flatListeners;
    };

    /**
     * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Object} All listener functions for an event in an object.
     */
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;

        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }

        return response || listeners;
    };

    /**
     * Adds a listener function to the specified event.
     * The listener will not be added if it is a duplicate.
     * If the listener returns true then it will be removed after it is called.
     * If you pass a regular expression as the event name then the listener will be added to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListener = function addListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }

        return this;
    };

    /**
     * Alias of addListener
     */
    proto.on = alias('addListener');

    /**
     * Semi-alias of addListener. It will add a listener that will be
     * automatically removed after it's first execution.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addOnceListener = function addOnceListener(evt, listener) {
        return this.addListener(evt, {
            listener: listener,
            once: true
        });
    };

    /**
     * Alias of addOnceListener.
     */
    proto.once = alias('addOnceListener');

    /**
     * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
     * You need to tell it what event names should be matched by a regex.
     *
     * @param {String} evt Name of the event to create.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };

    /**
     * Uses defineEvent to define multiple events.
     *
     * @param {String[]} evts An array of event names to define.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvents = function defineEvents(evts) {
        for (var i = 0; i < evts.length; i += 1) {
            this.defineEvent(evts[i]);
        }
        return this;
    };

    /**
     * Removes a listener function from the specified event.
     * When passed a regular expression as the event name, it will remove the listener from all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to remove the listener from.
     * @param {Function} listener Method to remove from the event.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListener = function removeListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);

                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }

        return this;
    };

    /**
     * Alias of removeListener
     */
    proto.off = alias('removeListener');

    /**
     * Adds listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
     * You can also pass it a regular expression to add the array of listeners to all events that match it.
     * Yeah, this function does quite a bit. That's probably a bad thing.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListeners = function addListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(false, evt, listeners);
    };

    /**
     * Removes listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be removed.
     * You can also pass it a regular expression to remove the listeners from all events that match it.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListeners = function removeListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(true, evt, listeners);
    };

    /**
     * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
     * The first argument will determine if the listeners are removed (true) or added (false).
     * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be added/removed.
     * You can also pass it a regular expression to manipulate the listeners of all events that match it.
     *
     * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;

        // If evt is an object then pass each of it's properties to this method
        if (typeof evt === 'object' && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    // Pass the single listener straight through to the singular method
                    if (typeof value === 'function') {
                        single.call(this, i, value);
                    }
                    else {
                        // Otherwise pass back to the multiple function
                        multiple.call(this, i, value);
                    }
                }
            }
        }
        else {
            // So evt must be a string
            // And listeners must be an array of listeners
            // Loop over it and pass each one to the multiple method
            i = listeners.length;
            while (i--) {
                single.call(this, evt, listeners[i]);
            }
        }

        return this;
    };

    /**
     * Removes all listeners from a specified event.
     * If you do not specify an event then all listeners will be removed.
     * That means every event will be emptied.
     * You can also pass a regex to remove all events that match it.
     *
     * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;

        // Remove different things depending on the state of evt
        if (type === 'string') {
            // Remove all listeners for the specified event
            delete events[evt];
        }
        else if (type === 'object') {
            // Remove all events matching the regex.
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    delete events[key];
                }
            }
        }
        else {
            // Remove all listeners in all events
            delete this._events;
        }

        return this;
    };

    /**
     * Alias of removeEvent.
     *
     * Added to mirror the node API.
     */
    proto.removeAllListeners = alias('removeEvent');

    /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {Array} [args] Optional array of arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emitEvent = function emitEvent(evt, args) {
        var listeners = this.getListenersAsObject(evt);
        var listener;
        var i;
        var key;
        var response;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                i = listeners[key].length;

                while (i--) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[key][i];

                    if (listener.once === true) {
                        this.removeListener(evt, listener.listener);
                    }

                    response = listener.listener.apply(this, args || []);

                    if (response === this._getOnceReturnValue()) {
                        this.removeListener(evt, listener.listener);
                    }
                }
            }
        }

        return this;
    };

    /**
     * Alias of emitEvent
     */
    proto.trigger = alias('emitEvent');

    /**
     * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
     * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {...*} Optional additional arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emit = function emit(evt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(evt, args);
    };

    /**
     * Sets the current value to check against when executing listeners. If a
     * listeners return value matches the one set here then it will be removed
     * after execution. This value defaults to true.
     *
     * @param {*} value The new value to check for when executing listeners.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };

    /**
     * Fetches the current value to check against when executing listeners. If
     * the listeners return value matches this one then it should be removed
     * automatically. It will return true by default.
     *
     * @return {*|Boolean} The current value to check for or the default, true.
     * @api private
     */
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        }
        else {
            return true;
        }
    };

    /**
     * Fetches the events object and creates one if required.
     *
     * @return {Object} The events storage object.
     * @api private
     */
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };

    /**
     * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
     *
     * @return {Function} Non conflicting EventEmitter class.
     */
    EventEmitter.noConflict = function noConflict() {
        exports.EventEmitter = originalGlobalValue;
        return EventEmitter;
    };

    // Expose the class either via AMD, CommonJS or the global object
    if (typeof define === 'function' && define.amd) {
        define('eventEmitter/EventEmitter',[],function () {
            return EventEmitter;
        });
    }
    else if (typeof module === 'object' && module.exports){
        module.exports = EventEmitter;
    }
    else {
        this.EventEmitter = EventEmitter;
    }
}.call(this));

/*!
 * eventie v1.0.4
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 */

/*jshint browser: true, undef: true, unused: true */
/*global define: false */

( function( window ) {



    var docElem = document.documentElement;

    var bind = function() {};

    function getIEEvent( obj ) {
        var event = window.event;
        // add event.target
        event.target = event.target || event.srcElement || obj;
        return event;
    }

    if ( docElem.addEventListener ) {
        bind = function( obj, type, fn ) {
            obj.addEventListener( type, fn, false );
        };
    } else if ( docElem.attachEvent ) {
        bind = function( obj, type, fn ) {
            obj[ type + fn ] = fn.handleEvent ?
                function() {
                    var event = getIEEvent( obj );
                    fn.handleEvent.call( fn, event );
                } :
                function() {
                    var event = getIEEvent( obj );
                    fn.call( obj, event );
                };
            obj.attachEvent( "on" + type, obj[ type + fn ] );
        };
    }

    var unbind = function() {};

    if ( docElem.removeEventListener ) {
        unbind = function( obj, type, fn ) {
            obj.removeEventListener( type, fn, false );
        };
    } else if ( docElem.detachEvent ) {
        unbind = function( obj, type, fn ) {
            obj.detachEvent( "on" + type, obj[ type + fn ] );
            try {
                delete obj[ type + fn ];
            } catch ( err ) {
                // can't delete window object properties
                obj[ type + fn ] = undefined;
            }
        };
    }

    var eventie = {
        bind: bind,
        unbind: unbind
    };

// transport
    if ( typeof define === 'function' && define.amd ) {
        // AMD
        define( 'eventie/eventie',eventie );
    } else {
        // browser global
        window.eventie = eventie;
    }

})( this );

/*!
 * imagesReady v3.1.8
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

( function( window, factory ) {
    // universal module definition

    /*global define: false, module: false, require: false */

    if ( typeof define === 'function' && define.amd ) {
        // AMD
        define( [
            'eventEmitter/EventEmitter',
            'eventie/eventie'
        ], function( EventEmitter, eventie ) {
            return factory( window, EventEmitter, eventie );
        });
    } else if ( typeof exports === 'object' ) {
        // CommonJS
        module.exports = factory(
            window,
            require('wolfy87-eventemitter'),
            require('eventie')
        );
    } else {
        // browser global
        window.imagesReady = factory(
            window,
            window.EventEmitter,
            window.eventie
        );
    }

})( window,

// --------------------------  factory -------------------------- //

    function factory( window, EventEmitter, eventie ) {



        var $ = window.jQuery;
        var console = window.console;
        var hasConsole = typeof console !== 'undefined';

// -------------------------- helpers -------------------------- //

// extend objects
        function extend( a, b ) {
            for ( var prop in b ) {
                a[ prop ] = b[ prop ];
            }
            return a;
        }

        var objToString = Object.prototype.toString;
        function isArray( obj ) {
            return objToString.call( obj ) === '[object Array]';
        }

// turn element or nodeList into an array
        function makeArray( obj ) {
            var ary = [];
            if ( isArray( obj ) ) {
                // use object if already an array
                ary = obj;
            } else if ( typeof obj.length === 'number' ) {
                // convert nodeList to array
                for ( var i=0, len = obj.length; i < len; i++ ) {
                    ary.push( obj[i] );
                }
            } else {
                // array of single index
                ary.push( obj );
            }
            return ary;
        }

        // -------------------------- imagesReady -------------------------- //

        /**
         * @param {Array, Element, NodeList, String} elem
         * @param {Object or Function} options - if function, use as callback
         * @param {Function} onAlways - callback function
         */
        function imagesReady( elem, options, onAlways ) {
            // coerce imagesReady() without new, to be new imagesReady()
            if ( !( this instanceof imagesReady ) ) {
                return new imagesReady( elem, options );
            }
            // use elem as selector string
            if ( typeof elem === 'string' ) {
                elem = document.querySelectorAll( elem );
            }

            this.elements = makeArray( elem );
            this.options = extend( {}, this.options );

            if ( typeof options === 'function' ) {
                onAlways = options;
            } else {
                extend( this.options, options );
            }

            if ( onAlways ) {
                this.on( 'always', onAlways );
            }

            this.getImages();

            if ( $ ) {
                // add jQuery Deferred object
                this.jqDeferred = new $.Deferred();
            }

            // HACK check async to allow time to bind listeners
            var _this = this;
            setTimeout( function() {
                _this.check();
            });
        }

        imagesReady.prototype = new EventEmitter();

        imagesReady.prototype.options = {};

        imagesReady.prototype.getImages = function() {
            this.images = [];

            // filter & find items if we have an item selector
            for ( var i=0, len = this.elements.length; i < len; i++ ) {
                var elem = this.elements[i];
                // filter siblings
                if ( elem.nodeName === 'IMG' ) {
                    this.addImage( elem );
                }
                // find children
                // no non-element nodes, #143
                var nodeType = elem.nodeType;
                if ( !nodeType || !( nodeType === 1 || nodeType === 9 || nodeType === 11 ) ) {
                    continue;
                }
                var childElems = elem.querySelectorAll('img');
                // concat childElems to filterFound array
                for ( var j=0, jLen = childElems.length; j < jLen; j++ ) {
                    var img = childElems[j];
                    this.addImage( img );
                }
            }
        };

        /**
         * @param {Image} img
         */
        imagesReady.prototype.addImage = function( img ) {
            var loadingImage = new LoadingImage( img );
            this.images.push( loadingImage );
        };

        imagesReady.prototype.check = function() {
            var _this = this;
            var checkedCount = 0;
            var length = this.images.length;
            this.hasAnyBroken = false;
            // complete if no images
            if ( !length ) {
                this.complete();
                return;
            }

            function onConfirm( image, message ) {
                if ( _this.options.debug && hasConsole ) {
                    console.log( 'confirm', image, message );
                }

                _this.progress( image );
                checkedCount++;
                if ( checkedCount === length ) {
                    _this.complete();
                }
                return true; // bind once
            }

            for ( var i=0; i < length; i++ ) {
                var loadingImage = this.images[i];
                loadingImage.on( 'confirm', onConfirm );
                loadingImage.check();
            }
        };

        imagesReady.prototype.progress = function( image ) {
            this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
            // HACK - Chrome triggers event before object properties have changed. #83
            var _this = this;
            setTimeout( function() {
                _this.emit( 'progress', _this, image );
                if ( _this.jqDeferred && _this.jqDeferred.notify ) {
                    _this.jqDeferred.notify( _this, image );
                }
            });
        };

        imagesReady.prototype.complete = function() {
            var eventName = this.hasAnyBroken ? 'fail' : 'done';
            this.isComplete = true;
            var _this = this;
            // HACK - another setTimeout so that confirm happens after progress
            setTimeout( function() {
                _this.emit( eventName, _this );
                _this.emit( 'always', _this );
                if ( _this.jqDeferred ) {
                    var jqMethod = _this.hasAnyBroken ? 'reject' : 'resolve';
                    _this.jqDeferred[ jqMethod ]( _this );
                }
            });
        };

        // -------------------------- jquery -------------------------- //

        if ( $ ) {
            $.fn.imagesReady = function( options, callback ) {
                var instance = new imagesReady( this, options, callback );
                return instance.jqDeferred.promise( $(this) );
            };
        }


        // --------------------------  -------------------------- //

        function LoadingImage( img ) {
            this.img = img;
        }

        LoadingImage.prototype = new EventEmitter();

        LoadingImage.prototype.check = function() {
            // first check cached any previous images that have same src
            var resource = cache[ this.img.src ] || new Resource( this.img.src );
            if ( resource.isConfirmed ) {
                this.confirm( resource.isLoaded, 'cached was confirmed' );
                return;
            }

            // If complete is true and browser supports natural sizes,
            // try to check for image status manually.
            if ( this.img.complete && this.img.naturalWidth !== undefined ) {
                // report based on naturalWidth
                this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
                return;
            }

            // If none of the checks above matched, simulate loading on detached element.
            var _this = this;
            resource.on( 'confirm', function( resrc, message ) {
                _this.confirm( resrc.isLoaded, message );
                return true;
            });

            resource.check();
        };

        LoadingImage.prototype.confirm = function( isLoaded, message ) {
            this.isLoaded = isLoaded;
            this.emit( 'confirm', this, message );
        };

        // -------------------------- Resource -------------------------- //

        // Resource checks each src, only once
        // separate class from LoadingImage to prevent memory leaks. See #115

        var cache = {};

        function Resource( src ) {
            this.src = src;
            // add to cache
            cache[ src ] = this;
        }

        Resource.prototype = new EventEmitter();

        Resource.prototype.check = function() {
            // only trigger checking once
            if ( this.isChecked ) {
                return;
            }
            // simulate loading on detached element
            var proxyImage = new Image();
            eventie.bind( proxyImage, 'load', this );
            eventie.bind( proxyImage, 'error', this );
            proxyImage.src = this.src;
            // set flag
            this.isChecked = true;
        };

        // ----- events ----- //

        // trigger specified handler for event type
        Resource.prototype.handleEvent = function( event ) {
            var method = 'on' + event.type;
            if ( this[ method ] ) {
                this[ method ]( event );
            }
        };

        Resource.prototype.onload = function( event ) {
            this.confirm( true, 'onload' );
            this.unbindProxyEvents( event );
        };

        Resource.prototype.onerror = function( event ) {
            this.confirm( false, 'onerror' );
            this.unbindProxyEvents( event );
        };

        // ----- confirm ----- //

        Resource.prototype.confirm = function( isLoaded, message ) {
            this.isConfirmed = true;
            this.isLoaded = isLoaded;
            this.emit( 'confirm', this, message );
        };

        Resource.prototype.unbindProxyEvents = function( event ) {
            eventie.unbind( event.target, 'load', this );
            eventie.unbind( event.target, 'error', this );
        };

        // -----  ----- //

        return imagesReady;

    });/*
 * Released under the MIT, GPL licenses
 * http://jquery.org/license
 */
/*global window: false, jQuery: false, console: false, define: false */

/* Cache window, document, undefined */
(function (window, document, undefined) {

// Uses AMD or browser globals to create a jQuery plugin.
    (function (factory) {
        "use strict";
        if (typeof define === 'function' && define.amd) {
            define(['jquery'], factory);
        }
        else if (jQuery && !jQuery.fn.loltip) {
            factory(jQuery);
        }
    }
    (function ($) {
        "use strict"; // Enable ECMAScript "strict" operation for this function. See more: http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/

        // Munge the primitives - Paul Irish tip
        var TRUE = true,
            FALSE = false,
            NULL = null,

// Common variables
            X = 'x', Y = 'y',
            WIDTH = 'width',
            HEIGHT = 'height',

// Positioning sides
            TOP = 'top',
            LEFT = 'left',
            BOTTOM = 'bottom',
            RIGHT = 'right',
            CENTER = 'center',

// Position adjustment types
            FLIP = 'flip',
            FLIPINVERT = 'flipinvert',
            SHIFT = 'shift',

// Shortcut vars
            LOLTIP, PROTOTYPE, CORNER, CHECKS,
            PLUGINS = {},
            NAMESPACE = 'loltip',
            ATTR_HAS = 'data-hasloltip',
            ATTR_ID = 'data-loltip-id',
            WIDGET = ['ui-widget', 'ui-tooltip'],
            SELECTOR = '.' + NAMESPACE,
            INACTIVE_EVENTS = 'click dblclick mousedown mouseup mousemove mouseleave mouseenter'.split(' '),

            CLASS_FIXED = NAMESPACE + '-fixed',
            CLASS_DEFAULT = NAMESPACE + '-default',
            CLASS_FOCUS = NAMESPACE + '-focus',
            CLASS_HOVER = NAMESPACE + '-hover',
            CLASS_DISABLED = NAMESPACE + '-disabled',

            replaceSuffix = '_replacedByloltip',
            oldtitle = 'oldtitle',
            trackingBound,

// Browser detection
            BROWSER = {
                /*
                 * IE version detection
                 *
                 * Adapted from: http://ajaxian.com/archives/attack-of-the-ie-conditional-comment
                 * Credit to James Padolsey for the original implemntation!
                 */
                ie: (function () {
                    var v = 3, div = document.createElement('div');
                    while ((div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->')) {
                        if (!div.getElementsByTagName('i')[0]) {
                            break;
                        }
                    }
                    return v > 4 ? v : NaN;
                }()),

                /*
                 * iOS version detection
                 */
                iOS: parseFloat(
                    ('' + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent) || [0, ''])[1])
                        .replace('undefined', '3_2').replace('_', '.').replace('_', '')
                ) || FALSE
            };

        function Loltip(target, options, id, attr) {
            // Elements and ID
            this.id = id;
            this.target = target;
            this.tooltip = NULL;
            this.elements = { target: target };

            // Internal constructs
            this._id = NAMESPACE + '-' + id;
            this.timers = { img: {} };
            this.options = options;
            this.plugins = {};

            // Cache object
            this.cache = {
                event: {},
                target: $(),
                disabled: FALSE,
                attr: attr,
                onTooltip: FALSE,
                lastClass: ''
            };

            // Set the initial flags
            this.rendered = this.destroyed = this.disabled = this.waiting =
                this.hiddenDuringWait = this.positioning = this.triggering = FALSE;
        }

        PROTOTYPE = Loltip.prototype;

        PROTOTYPE._when = function (deferreds) {
            return $.when.apply($, deferreds);
        };

        PROTOTYPE.render = function (show) {
            if (this.rendered || this.destroyed) {
                return this;
            } // If tooltip has already been rendered, exit

            var self = this,
                options = this.options,
                cache = this.cache,
                elements = this.elements,
                text = options.content.text,
                title = options.content.title,
                button = options.content.button,
                posOptions = options.position,
                namespace = '.' + this._id + ' ',
                deferreds = [],
                tooltip;

            // Add ARIA attributes to target
            $.attr(this.target[0], 'aria-describedby', this._id);

            // Create tooltip element
            this.tooltip = elements.tooltip = tooltip = $('<div/>', {
                'id': this._id,
                'class': [ NAMESPACE, CLASS_DEFAULT, options.style.classes, NAMESPACE + '-pos-' + options.position.my.abbrev() ].join(' '),
                'width': options.style.width || '',
                'height': options.style.height || '',
                'tracking': posOptions.target === 'mouse' && posOptions.adjust.mouse,

                /* ARIA specific attributes */
                'role': 'alert',
                'aria-live': 'polite',
                'aria-atomic': FALSE,
                'aria-describedby': this._id + '-content',
                'aria-hidden': TRUE
            })
                .toggleClass(CLASS_DISABLED, this.disabled)
                .attr(ATTR_ID, this.id)
                .data(NAMESPACE, this)
                .appendTo(posOptions.container)
                .append(
                    // Create content element
                    elements.content = $('<div />', {
                        'class': NAMESPACE + '-content',
                        'id': this._id + '-content',
                        'aria-atomic': TRUE
                    })
                );

            // Set rendered flag and prevent redundant reposition calls for now
            this.rendered = -1;
            this.positioning = TRUE;

            // Create title...
            if (title) {
                this._createTitle();

                // Update title only if its not a callback (called in toggle if so)
                if (!$.isFunction(title)) {
                    deferreds.push(this._updateTitle(title, FALSE));
                }
            }

            // Create button
            if (button) {
                this._createButton();
            }

            // Set proper rendered flag and update content if not a callback function (called in toggle)
            if (!$.isFunction(text)) {
                deferreds.push(this._updateContent(text, FALSE));
            }
            this.rendered = TRUE;

            // Setup widget classes
            this._setWidget();

            // Initialize 'render' plugins
            $.each(PLUGINS, function (name) {
                var instance;
                if (this.initialize === 'render' && (instance = this(self))) {
                    self.plugins[name] = instance;
                }
            });

            // Unassign initial events and assign proper events
            this._unassignEvents();
            this._assignEvents();

            // When deferreds have completed
            this._when(deferreds).then(function () {
                // tooltiprender event
                self._trigger('render');

                // Reset flags
                self.positioning = FALSE;

                // Show tooltip if not hidden during wait period
                if (!self.hiddenDuringWait && (options.show.ready || show)) {
                    self.toggle(TRUE, cache.event, FALSE);
                }
                self.hiddenDuringWait = FALSE;
            });

            // Expose API
            LOLTIP.api[this.id] = this;

            return this;
        };

        PROTOTYPE.destroy = function (immediate) {
            // Set flag the signify destroy is taking place to plugins
            // and ensure it only gets destroyed once!
            if (this.destroyed) {
                return this.target;
            }

            function process() {
                if (this.destroyed) {
                    return;
                }
                this.destroyed = TRUE;

                var target = this.target,
                    title = target.attr(oldtitle);

                // Destroy tooltip if rendered
                if (this.rendered) {
                    this.tooltip.stop(1, 0).find('*').remove().end().remove();
                }

                // Destroy all plugins
                $.each(this.plugins, function (name) {
                    this.destroy && this.destroy();
                });

                // Clear timers and remove bound events
                clearTimeout(this.timers.show);
                clearTimeout(this.timers.hide);
                this._unassignEvents();

                // Remove api object and ARIA attributes
                target.removeData(NAMESPACE)
                    .removeAttr(ATTR_ID)
                    .removeAttr(ATTR_HAS)
                    .removeAttr('aria-describedby');

                // Reset old title attribute if removed
                if (this.options.suppress && title) {
                    target.attr('title', title).removeAttr(oldtitle);
                }

                // Remove loltip events associated with this API
                this._unbind(target);

                // Remove ID from used id objects, and delete object references
                // for better garbage collection and leak protection
                this.options = this.elements = this.cache = this.timers =
                    this.plugins = this.mouse = NULL;

                // Delete epoxsed API object
                delete LOLTIP.api[this.id];
            }

            // If an immediate destory is needed
            if ((immediate !== TRUE || this.triggering === 'hide') && this.rendered) {
                this.tooltip.one('tooltiphidden', $.proxy(process, this));
                !this.triggering && this.hide();
            }

            // If we're not in the process of hiding... process
            else {
                process.call(this);
            }

            return this.target;
        };

        function invalidOpt(a) {
            return a === NULL || $.type(a) !== 'object';
        }

        function invalidContent(c) {
            return !( $.isFunction(c) || (c && c.attr) || c.length || ($.type(c) === 'object' && (c.jquery || c.then) ));
        }

        // Option object sanitizer
        function sanitizeOptions(opts) {
            var content, text, ajax, once;

            if (invalidOpt(opts)) {
                return FALSE;
            }

            if (invalidOpt(opts.metadata)) {
                opts.metadata = { type: opts.metadata };
            }

            if ('content' in opts) {
                content = opts.content;

                if (invalidOpt(content) || content.jquery || content.done) {
                    content = opts.content = {
                        text: (text = invalidContent(content) ? FALSE : content)
                    };
                }
                else {
                    text = content.text;
                }

                // DEPRECATED - Old content.ajax plugin functionality
                // Converts it into the proper Deferred syntax
                if ('ajax' in content) {
                    ajax = content.ajax;
                    once = ajax && ajax.once !== FALSE;
                    delete content.ajax;

                    content.text = function (event, api) {
                        var loading = text || $(this).attr(api.options.content.attr) || 'Loading...',

                            deferred = $.ajax(
                                    $.extend({}, ajax, { context: api })
                                )
                                .then(ajax.success, NULL, ajax.error)
                                .then(function (content) {
                                    if (content && once) {
                                        api.set('content.text', content);
                                    }
                                    return content;
                                },
                                function (xhr, status, error) {
                                    if (api.destroyed || xhr.status === 0) {
                                        return;
                                    }
                                    api.set('content.text', status + ': ' + error);
                                });

                        return !once ? (api.set('content.text', loading), deferred) : loading;
                    };
                }

                if ('title' in content) {
                    if (!invalidOpt(content.title)) {
                        content.button = content.title.button;
                        content.title = content.title.text;
                    }

                    if (invalidContent(content.title || FALSE)) {
                        content.title = FALSE;
                    }
                }
            }

            if ('position' in opts && invalidOpt(opts.position)) {
                opts.position = { my: opts.position, at: opts.position };
            }

            if ('show' in opts && invalidOpt(opts.show)) {
                opts.show = opts.show.jquery ? { target: opts.show } :
                    opts.show === TRUE ? { ready: TRUE } : { event: opts.show };
            }

            if ('hide' in opts && invalidOpt(opts.hide)) {
                opts.hide = opts.hide.jquery ? { target: opts.hide } : { event: opts.hide };
            }

            if ('style' in opts && invalidOpt(opts.style)) {
                opts.style = { classes: opts.style };
            }

            // Sanitize plugin options
            $.each(PLUGINS, function () {
                this.sanitize && this.sanitize(opts);
            });

            return opts;
        }

// Setup builtin .set() option checks
        CHECKS = PROTOTYPE.checks = {
            builtin: {
                // Core checks
                '^id$': function (obj, o, v, prev) {
                    var id = v === TRUE ? LOLTIP.nextid : v,
                        new_id = NAMESPACE + '-' + id;

                    if (id !== FALSE && id.length > 0 && !$('#' + new_id).length) {
                        this._id = new_id;

                        if (this.rendered) {
                            this.tooltip[0].id = this._id;
                            this.elements.content[0].id = this._id + '-content';
                            this.elements.title[0].id = this._id + '-title';
                        }
                    }
                    else {
                        obj[o] = prev;
                    }
                },
                '^prerender': function (obj, o, v) {
                    v && !this.rendered && this.render(this.options.show.ready);
                },

                // Content checks
                '^content.text$': function (obj, o, v) {
                    this._updateContent(v);
                },
                '^content.attr$': function (obj, o, v, prev) {
                    if (this.options.content.text === this.target.attr(prev)) {
                        this._updateContent(this.target.attr(v));
                    }
                },
                '^content.title$': function (obj, o, v) {
                    // Remove title if content is null
                    if (!v) {
                        return this._removeTitle();
                    }

                    // If title isn't already created, create it now and update
                    v && !this.elements.title && this._createTitle();
                    this._updateTitle(v);
                },
                '^content.button$': function (obj, o, v) {
                    this._updateButton(v);
                },
                '^content.title.(text|button)$': function (obj, o, v) {
                    this.set('content.' + o, v); // Backwards title.text/button compat
                },

                // Position checks
                '^position.(my|at)$': function (obj, o, v) {
                    'string' === typeof v && (obj[o] = new CORNER(v, o === 'at'));
                },
                '^position.container$': function (obj, o, v) {
                    this.rendered && this.tooltip.appendTo(v);
                },

                // Show checks
                '^show.ready$': function (obj, o, v) {
                    v && (!this.rendered && this.render(TRUE) || this.toggle(TRUE));
                },

                // Style checks
                '^style.classes$': function (obj, o, v, p) {
                    this.rendered && this.tooltip.removeClass(p).addClass(v);
                },
                '^style.(width|height)': function (obj, o, v) {
                    this.rendered && this.tooltip.css(o, v);
                },
                '^style.widget|content.title': function () {
                    this.rendered && this._setWidget();
                },
                '^style.def': function (obj, o, v) {
                    this.rendered && this.tooltip.toggleClass(CLASS_DEFAULT, !!v);
                },

                // Events check
                '^events.(render|show|move|hide|focus|blur)$': function (obj, o, v) {
                    this.rendered && this.tooltip[($.isFunction(v) ? '' : 'un') + 'bind']('tooltip' + o, v);
                },

                // Properties which require event reassignment
                '^(show|hide|position).(event|target|fixed|inactive|leave|distance|viewport|adjust)': function () {
                    if (!this.rendered) {
                        return;
                    }

                    // Set tracking flag
                    var posOptions = this.options.position;
                    this.tooltip.attr('tracking', posOptions.target === 'mouse' && posOptions.adjust.mouse);

                    // Reassign events
                    this._unassignEvents();
                    this._assignEvents();
                }
            }
        };

// Dot notation converter
        function convertNotation(options, notation) {
            var i = 0, obj, option = options,

            // Split notation into array
                levels = notation.split('.');

            // Loop through
            while (option = option[ levels[i++] ]) {
                if (i < levels.length) {
                    obj = option;
                }
            }

            return [obj || options, levels.pop()];
        }

        PROTOTYPE.get = function (notation) {
            if (this.destroyed) {
                return this;
            }

            var o = convertNotation(this.options, notation.toLowerCase()),
                result = o[0][ o[1] ];

            return result.precedance ? result.string() : result;
        };

        function setCallback(notation, args) {
            var category, rule, match;

            for (category in this.checks) {
                for (rule in this.checks[category]) {
                    if (match = (new RegExp(rule, 'i')).exec(notation)) {
                        args.push(match);

                        if (category === 'builtin' || this.plugins[category]) {
                            this.checks[category][rule].apply(
                                this.plugins[category] || this, args
                            );
                        }
                    }
                }
            }
        }

        var rmove = /^position\.(my|at|adjust|target|container|viewport)|style|content|show\.ready/i,
            rrender = /^prerender|show\.ready/i;

        PROTOTYPE.set = function (option, value) {
            if (this.destroyed) {
                return this;
            }

            var rendered = this.rendered,
                reposition = FALSE,
                options = this.options,
                checks = this.checks,
                name;

            // Convert singular option/value pair into object form
            if ('string' === typeof option) {
                name = option;
                option = {};
                option[name] = value;
            }
            else {
                option = $.extend({}, option);
            }

            // Set all of the defined options to their new values
            $.each(option, function (notation, value) {
                if (rendered && rrender.test(notation)) {
                    delete option[notation];
                    return;
                }

                // Set new obj value
                var obj = convertNotation(options, notation.toLowerCase()), previous;
                previous = obj[0][ obj[1] ];
                obj[0][ obj[1] ] = value && value.nodeType ? $(value) : value;

                // Also check if we need to reposition
                reposition = rmove.test(notation) || reposition;

                // Set the new params for the callback
                option[notation] = [obj[0], obj[1], value, previous];
            });

            // Re-sanitize options
            sanitizeOptions(options);

            /*
             * Execute any valid callbacks for the set options
             * Also set positioning flag so we don't get loads of redundant repositioning calls.
             */
            this.positioning = TRUE;
            $.each(option, $.proxy(setCallback, this));
            this.positioning = FALSE;

            // Update position if needed
            if (this.rendered && this.tooltip[0].offsetWidth > 0 && reposition) {
                this.reposition(options.position.target === 'mouse' ? NULL : this.cache.event);
            }

            return this;
        };

        PROTOTYPE._update = function (content, element, reposition) {
            var self = this,
                cache = this.cache;

            // Make sure tooltip is rendered and content is defined. If not return
            if (!this.rendered || !content) {
                return FALSE;
            }

            // Use function to parse content
            if ($.isFunction(content)) {
                content = content.call(this.elements.target, cache.event, this) || '';
            }

            // Handle deferred content
            if ($.isFunction(content.then)) {
                cache.waiting = TRUE;
                return content.then(function (c) {
                    cache.waiting = FALSE;
                    return self._update(c, element);
                }, NULL, function (e) {
                    return self._update(e, element);
                });
            }

            // If content is null... return false
            if (content === FALSE || (!content && content !== '')) {
                return FALSE;
            }

            // Append new content if its a DOM array and show it if hidden
            if (content.jquery && content.length > 0) {
                element.empty().append(
                    content.css({ display: 'block', visibility: 'visible' })
                );
            }

            // Content is a regular string, insert the new content
            else {
                element.html(content);
            }

            // Wait for content to be loaded, and reposition
            return this._waitForContent(element).then(function (images) {
                if (images.images && images.images.length && self.rendered && self.tooltip[0].offsetWidth > 0) {
                    self.reposition(cache.event, !images.length);
                }
            });
        };

        PROTOTYPE._waitForContent = function (element) {
            var cache = this.cache;

            // Set flag
            cache.waiting = TRUE;

            // If imagesReady is included, ensure images have loaded and return promise
            return ( $.fn.imagesReady ? element.imagesReady() : $.Deferred().resolve([]) )
                .done(function () {
                    cache.waiting = FALSE;
                })
                .promise();
        };

        PROTOTYPE._updateContent = function (content, reposition) {
            this._update(content, this.elements.content, reposition);
        };

        PROTOTYPE._updateTitle = function (content, reposition) {
            if (this._update(content, this.elements.title, reposition) === FALSE) {
                this._removeTitle(FALSE);
            }
        };

        PROTOTYPE._createTitle = function () {
            var elements = this.elements,
                id = this._id + '-title';

            // Destroy previous title element, if present
            if (elements.titlebar) {
                this._removeTitle();
            }

            // Create title bar and title elements
            elements.titlebar = $('<div />', {
                'class': NAMESPACE + '-titlebar ' + (this.options.style.widget ? createWidgetClass('header') : '')
            })
                .append(
                    elements.title = $('<div />', {
                        'id': id,
                        'class': NAMESPACE + '-title',
                        'aria-atomic': TRUE
                    })
                )
                .insertBefore(elements.content)

                // Button-specific events
                .delegate('.loltip-close', 'mousedown keydown mouseup keyup mouseout', function (event) {
                    $(this).toggleClass('ui-state-active ui-state-focus', event.type.substr(-4) === 'down');
                })
                .delegate('.loltip-close', 'mouseover mouseout', function (event) {
                    $(this).toggleClass('ui-state-hover', event.type === 'mouseover');
                });

            // Create button if enabled
            if (this.options.content.button) {
                this._createButton();
            }
        };

        PROTOTYPE._removeTitle = function (reposition) {
            var elements = this.elements;

            if (elements.title) {
                elements.titlebar.remove();
                elements.titlebar = elements.title = elements.button = NULL;

                // Reposition if enabled
                if (reposition !== FALSE) {
                    this.reposition();
                }
            }
        };

        PROTOTYPE.reposition = function (event, effect) {
            if (!this.rendered || this.positioning || this.destroyed) {
                return this;
            }

            // Set positioning flag
            this.positioning = TRUE;

            var cache = this.cache,
                tooltip = this.tooltip,
                posOptions = this.options.position,
                target = posOptions.target,
                my = posOptions.my,
                at = posOptions.at,
                viewport = posOptions.viewport,
                container = posOptions.container,
                adjust = posOptions.adjust,
                method = adjust.method.split(' '),
                tooltipWidth = tooltip.outerWidth(FALSE),
                tooltipHeight = tooltip.outerHeight(FALSE),
                targetWidth = 0,
                targetHeight = 0,
                type = tooltip.css('position'),
                position = { left: 0, top: 0 },
                visible = tooltip[0].offsetWidth > 0,
                isScroll = event && event.type === 'scroll',
                win = $(window),
                doc = container[0].ownerDocument,
                mouse = this.mouse,
                pluginCalculations, offset;

            // Check if absolute position was passed
            if ($.isArray(target) && target.length === 2) {
                // Force left top and set position
                at = { x: LEFT, y: TOP };
                position = { left: target[0], top: target[1] };
            }

            // Check if mouse was the target
            else if (target === 'mouse') {
                // Force left top to allow flipping
                at = { x: LEFT, y: TOP };

                // Use the cached mouse coordinates if available, or passed event has no coordinates
                if (mouse && mouse.pageX && (adjust.mouse || !event || !event.pageX)) {
                    event = mouse;
                }

                // If the passed event has no coordinates (such as a scroll event)
                else if (!event || !event.pageX) {
                    // Use the mouse origin that caused the show event, if distance hiding is enabled
                    if ((!adjust.mouse || this.options.show.distance) && cache.origin && cache.origin.pageX) {
                        event = cache.origin;
                    }

                    // Use cached event for resize/scroll events
                    else if (!event || (event && (event.type === 'resize' || event.type === 'scroll'))) {
                        event = cache.event;
                    }
                }

                // Calculate body and container offset and take them into account below
                if (type !== 'static') {
                    position = container.offset();
                }
                if (doc.body.offsetWidth !== (window.innerWidth || doc.documentElement.clientWidth)) {
                    offset = $(document.body).offset();
                }

                // Use event coordinates for position
                position = {
                    left: event.pageX - position.left + (offset && offset.left || 0),
                    top: event.pageY - position.top + (offset && offset.top || 0)
                };

                // Scroll events are a pain, some browsers
                if (adjust.mouse && isScroll && mouse) {
                    position.left -= (mouse.scrollX || 0) - win.scrollLeft();
                    position.top -= (mouse.scrollY || 0) - win.scrollTop();
                }
            }

            // Target wasn't mouse or absolute...
            else {
                // Check if event targetting is being used
                if (target === 'event') {
                    if (event && event.target && event.type !== 'scroll' && event.type !== 'resize') {
                        cache.target = $(event.target);
                    }
                    else if (!event.target) {
                        cache.target = this.elements.target;
                    }
                }
                else if (target !== 'event') {
                    cache.target = $(target.jquery ? target : this.elements.target);
                }
                target = cache.target;

                // Parse the target into a jQuery object and make sure there's an element present
                target = $(target).eq(0);
                if (target.length === 0) {
                    return this;
                }

                // Check if window or document is the target
                else if (target[0] === document || target[0] === window) {
                    targetWidth = BROWSER.iOS ? window.innerWidth : target.width();
                    targetHeight = BROWSER.iOS ? window.innerHeight : target.height();

                    if (target[0] === window) {
                        position = {
                            top: (viewport || target).scrollTop(),
                            left: (viewport || target).scrollLeft()
                        };
                    }
                }

                // Check if the target is an <AREA> element
                else if (PLUGINS.imagemap && target.is('area')) {
                    pluginCalculations = PLUGINS.imagemap(this, target, at, PLUGINS.viewport ? method : FALSE);
                }

                // Check if the target is an SVG element
                else if (PLUGINS.svg && target && target[0].ownerSVGElement) {
                    pluginCalculations = PLUGINS.svg(this, target, at, PLUGINS.viewport ? method : FALSE);
                }

                // Otherwise use regular jQuery methods
                else {
                    targetWidth = target.outerWidth(FALSE);
                    targetHeight = target.outerHeight(FALSE);
                    position = target.offset();
                }

                // Parse returned plugin values into proper variables
                if (pluginCalculations) {
                    targetWidth = pluginCalculations.width;
                    targetHeight = pluginCalculations.height;
                    offset = pluginCalculations.offset;
                    position = pluginCalculations.position;
                }

                // Adjust position to take into account offset parents
                position = this.reposition.offset(target, position, container);

                // Adjust for position.fixed tooltips (and also iOS scroll bug in v3.2-4.0 & v4.3-4.3.2)
                if ((BROWSER.iOS > 3.1 && BROWSER.iOS < 4.1) ||
                    (BROWSER.iOS >= 4.3 && BROWSER.iOS < 4.33) ||
                    (!BROWSER.iOS && type === 'fixed')
                    ) {
                    position.left -= win.scrollLeft();
                    position.top -= win.scrollTop();
                }

                // Adjust position relative to target
                if (!pluginCalculations || (pluginCalculations && pluginCalculations.adjustable !== FALSE)) {
                    position.left += at.x === RIGHT ? targetWidth : at.x === CENTER ? targetWidth / 2 : 0;
                    position.top += at.y === BOTTOM ? targetHeight : at.y === CENTER ? targetHeight / 2 : 0;
                }
            }

            // Adjust position relative to tooltip
            position.left += adjust.x + (my.x === RIGHT ? -tooltipWidth : my.x === CENTER ? -tooltipWidth / 2 : 0);
            position.top += adjust.y + (my.y === BOTTOM ? -tooltipHeight : my.y === CENTER ? -tooltipHeight / 2 : 0);

            // Use viewport adjustment plugin if enabled
            if (PLUGINS.viewport) {
                position.adjusted = PLUGINS.viewport(
                    this, position, posOptions, targetWidth, targetHeight, tooltipWidth, tooltipHeight
                );

                // Apply offsets supplied by positioning plugin (if used)
                if (offset && position.adjusted.left) {
                    position.left += offset.left;
                }
                if (offset && position.adjusted.top) {
                    position.top += offset.top;
                }
            }

            // Viewport adjustment is disabled, set values to zero
            else {
                position.adjusted = { left: 0, top: 0 };
            }

            // tooltipmove event
            if (!this._trigger('move', [position, viewport.elem || viewport], event)) {
                return this;
            }
            delete position.adjusted;

            // If effect is disabled, target it mouse, no animation is defined or positioning gives NaN out, set CSS directly
            if (effect === FALSE || !visible || isNaN(position.left) || isNaN(position.top) || target === 'mouse' || !$.isFunction(posOptions.effect)) {
                tooltip.css(position);
            }

            // Use custom function if provided
            else if ($.isFunction(posOptions.effect)) {
                posOptions.effect.call(tooltip, this, $.extend({}, position));
                tooltip.queue(function (next) {
                    // Reset attributes to avoid cross-browser rendering bugs
                    $(this).css({ opacity: '', height: '' });
                    if (BROWSER.ie) {
                        this.style.removeAttribute('filter');
                    }

                    next();
                });
            }

            // Set positioning flag
            this.positioning = FALSE;

            return this;
        };

// Custom (more correct for loltip!) offset calculator
        PROTOTYPE.reposition.offset = function (elem, pos, container) {
            if (!container[0]) {
                return pos;
            }

            var ownerDocument = $(elem[0].ownerDocument),
                quirks = !!BROWSER.ie && document.compatMode !== 'CSS1Compat',
                parent = container[0],
                scrolled, position, parentOffset, overflow;

            function scroll(e, i) {
                pos.left += i * e.scrollLeft();
                pos.top += i * e.scrollTop();
            }

            // Compensate for non-static containers offset
            do {
                if ((position = $.css(parent, 'position')) !== 'static') {
                    if (position === 'fixed') {
                        parentOffset = parent.getBoundingClientRect();
                        scroll(ownerDocument, -1);
                    }
                    else {
                        parentOffset = $(parent).position();
                        parentOffset.left += (parseFloat($.css(parent, 'borderLeftWidth')) || 0);
                        parentOffset.top += (parseFloat($.css(parent, 'borderTopWidth')) || 0);
                    }

                    pos.left -= parentOffset.left + (parseFloat($.css(parent, 'marginLeft')) || 0);
                    pos.top -= parentOffset.top + (parseFloat($.css(parent, 'marginTop')) || 0);

                    // If this is the first parent element with an overflow of "scroll" or "auto", store it
                    if (!scrolled && (overflow = $.css(parent, 'overflow')) !== 'hidden' && overflow !== 'visible') {
                        scrolled = $(parent);
                    }
                }
            }
            while ((parent = parent.offsetParent));

            // Compensate for containers scroll if it also has an offsetParent (or in IE quirks mode)
            if (scrolled && (scrolled[0] !== ownerDocument[0] || quirks)) {
                scroll(scrolled, 1);
            }

            return pos;
        };

// Corner class
        var C = (CORNER = PROTOTYPE.reposition.Corner = function (corner, forceY) {
            corner = ('' + corner).replace(/([A-Z])/, ' $1').replace(/middle/gi, CENTER).toLowerCase();
            this.x = (corner.match(/left|right/i) || corner.match(/center/) || ['inherit'])[0].toLowerCase();
            this.y = (corner.match(/top|bottom|center/i) || ['inherit'])[0].toLowerCase();
            this.forceY = !!forceY;

            var f = corner.charAt(0);
            this.precedance = (f === 't' || f === 'b' ? Y : X);
        }).prototype;

        C.invert = function (z, center) {
            this[z] = this[z] === LEFT ? RIGHT : this[z] === RIGHT ? LEFT : center || this[z];
        };

        C.string = function () {
            var x = this.x, y = this.y;
            return x === y ? x : this.precedance === Y || (this.forceY && y !== 'center') ? y + ' ' + x : x + ' ' + y;
        };

        C.abbrev = function () {
            var result = this.string().split(' ');
            return result[0].charAt(0) + (result[1] && result[1].charAt(0) || '');
        };

        C.clone = function () {
            return new CORNER(this.string(), this.forceY);
        };
        PROTOTYPE.toggle = function (state, event) {
            var cache = this.cache,
                options = this.options,
                tooltip = this.tooltip;

            // Try to prevent flickering when tooltip overlaps show element
            if (event) {
                if ((/over|enter/).test(event.type) && (/out|leave/).test(cache.event.type) &&
                    options.show.target.add(event.target).length === options.show.target.length &&
                    tooltip.has(event.relatedTarget).length) {
                    return this;
                }

                // Cache event
                cache.event = cloneEvent(event);
            }

            // If we're currently waiting and we've just hidden... stop it
            this.waiting && !state && (this.hiddenDuringWait = TRUE);

            // Render the tooltip if showing and it isn't already
            if (!this.rendered) {
                return state ? this.render(1) : this;
            }
            else if (this.destroyed || this.disabled) {
                return this;
            }

            var type = state ? 'show' : 'hide',
                opts = this.options[type],
                otherOpts = this.options[ !state ? 'show' : 'hide' ],
                posOptions = this.options.position,
                contentOptions = this.options.content,
                width = this.tooltip.css('width'),
                visible = this.tooltip.is(':visible'),
                animate = state || opts.target.length === 1,
                sameTarget = !event || opts.target.length < 2 || cache.target[0] === event.target,
                identicalState, allow, showEvent, delay, after;

            // Detect state if valid one isn't provided
            if ((typeof state).search('boolean|number')) {
                state = !visible;
            }

            // Check if the tooltip is in an identical state to the new would-be state
            identicalState = !tooltip.is(':animated') && visible === state && sameTarget;

            // Fire tooltip(show/hide) event and check if destroyed
            allow = !identicalState ? !!this._trigger(type, [90]) : NULL;

            // Check to make sure the tooltip wasn't destroyed in the callback
            if (this.destroyed) {
                return this;
            }

            // If the user didn't stop the method prematurely and we're showing the tooltip, focus it
            if (allow !== FALSE && state) {
                this.focus(event);
            }

            // If the state hasn't changed or the user stopped it, return early
            if (!allow || identicalState) {
                return this;
            }

            // Set ARIA hidden attribute
            $.attr(tooltip[0], 'aria-hidden', !!!state);

            // Execute state specific properties
            if (state) {
                // Store show origin coordinates
                cache.origin = cloneEvent(this.mouse);

                // Update tooltip content & title if it's a dynamic function
                if ($.isFunction(contentOptions.text)) {
                    this._updateContent(contentOptions.text, FALSE);
                }
                if ($.isFunction(contentOptions.title)) {
                    this._updateTitle(contentOptions.title, FALSE);
                }

                // Cache mousemove events for positioning purposes (if not already tracking)
                if (!trackingBound && posOptions.target === 'mouse' && posOptions.adjust.mouse) {
                    $(document).bind('mousemove.' + NAMESPACE, this._storeMouse);
                    trackingBound = TRUE;
                }

                // Update the tooltip position (set width first to prevent viewport/max-width issues)
                if (!width) {
                    tooltip.css('width', tooltip.outerWidth(FALSE));
                }
                this.reposition(event, arguments[2]);
                if (!width) {
                    tooltip.css('width', '');
                }

                // Hide other tooltips if tooltip is solo
                if (!!opts.solo) {
                    (typeof opts.solo === 'string' ? $(opts.solo) : $(SELECTOR, opts.solo))
                        .not(tooltip).not(opts.target).loltip('hide', $.Event('tooltipsolo'));
                }
            }
            else {
                // Clear show timer if we're hiding
                clearTimeout(this.timers.show);

                // Remove cached origin on hide
                delete cache.origin;

                // Remove mouse tracking event if not needed (all tracking loltips are hidden)
                if (trackingBound && !$(SELECTOR + '[tracking="true"]:visible', opts.solo).not(tooltip).length) {
                    $(document).unbind('mousemove.' + NAMESPACE);
                    trackingBound = FALSE;
                }

                // Blur the tooltip
                this.blur(event);
            }

            // Define post-animation, state specific properties
            after = $.proxy(function () {
                if (state) {
                    // Prevent antialias from disappearing in IE by removing filter
                    if (BROWSER.ie) {
                        tooltip[0].style.removeAttribute('filter');
                    }

                    // Remove overflow setting to prevent tip bugs
                    tooltip.css('overflow', '');

                    // Autofocus elements if enabled
                    if ('string' === typeof opts.autofocus) {
                        $(this.options.show.autofocus, tooltip).focus();
                    }

                    // If set, hide tooltip when inactive for delay period
                    this.options.show.target.trigger('loltip-' + this.id + '-inactive');
                }
                else {
                    // Reset CSS states
                    tooltip.css({
                        display: '',
                        visibility: '',
                        opacity: '',
                        left: '',
                        top: ''
                    });
                }

                // tooltipvisible/tooltiphidden events
                this._trigger(state ? 'visible' : 'hidden');
            }, this);

            // If no effect type is supplied, use a simple toggle
            if (opts.effect === FALSE || animate === FALSE) {
                tooltip[ type ]();
                after();
            }

            // Use custom function if provided
            else if ($.isFunction(opts.effect)) {
                tooltip.stop(1, 1);
                opts.effect.call(tooltip, this);
                tooltip.queue('fx', function (n) {
                    after();
                    n();
                });
            }

            // Use basic fade function by default
            else {
                tooltip.fadeTo(90, state ? 1 : 0, after);
            }

            // If inactive hide method is set, active it
            if (state) {
                opts.target.trigger('loltip-' + this.id + '-inactive');
            }

            return this;
        };

        PROTOTYPE.show = function (event) {
            return this.toggle(TRUE, event);
        };

        PROTOTYPE.hide = function (event) {
            return this.toggle(FALSE, event);
        };

        PROTOTYPE.focus = function (event) {
            if (!this.rendered || this.destroyed) {
                return this;
            }

            var loltips = $(SELECTOR),
                tooltip = this.tooltip,
                curIndex = parseInt(tooltip[0].style.zIndex, 10),
                newIndex = LOLTIP.zindex + loltips.length,
                focusedElem;

            // Only update the z-index if it has changed and tooltip is not already focused
            if (!tooltip.hasClass(CLASS_FOCUS)) {
                // tooltipfocus event
                if (this._trigger('focus', [newIndex], event)) {
                    // Only update z-index's if they've changed
                    if (curIndex !== newIndex) {
                        // Reduce our z-index's and keep them properly ordered
                        loltips.each(function () {
                            if (this.style.zIndex > curIndex) {
                                this.style.zIndex = this.style.zIndex - 1;
                            }
                        });

                        // Fire blur event for focused tooltip
                        loltips.filter('.' + CLASS_FOCUS).loltip('blur', event);
                    }

                    // Set the new z-index
                    tooltip.addClass(CLASS_FOCUS)[0].style.zIndex = newIndex;
                }
            }

            return this;
        };

        PROTOTYPE.blur = function (event) {
            if (!this.rendered || this.destroyed) {
                return this;
            }

            // Set focused status to FALSE
            this.tooltip.removeClass(CLASS_FOCUS);

            // tooltipblur event
            this._trigger('blur', [ this.tooltip.css('zIndex') ], event);

            return this;
        };

        PROTOTYPE.disable = function (state) {
            if (this.destroyed) {
                return this;
            }

            // If 'toggle' is passed, toggle the current state
            if (state === 'toggle') {
                state = !(this.rendered ? this.tooltip.hasClass(CLASS_DISABLED) : this.disabled);
            }

            // Disable if no state passed
            else if ('boolean' !== typeof state) {
                state = TRUE;
            }

            if (this.rendered) {
                this.tooltip.toggleClass(CLASS_DISABLED, state)
                    .attr('aria-disabled', state);
            }

            this.disabled = !!state;

            return this;
        };

        PROTOTYPE.enable = function () {
            return this.disable(FALSE);
        };

        PROTOTYPE._createButton = function () {
            var self = this,
                elements = this.elements,
                tooltip = elements.tooltip,
                button = this.options.content.button,
                isString = typeof button === 'string',
                close = isString ? button : 'Close tooltip';

            if (elements.button) {
                elements.button.remove();
            }

            // Use custom button if one was supplied by user, else use default
            if (button.jquery) {
                elements.button = button;
            }
            else {
                elements.button = $('<a />', {
                    'class': 'loltip-close ' + (this.options.style.widget ? '' : NAMESPACE + '-icon'),
                    'title': close,
                    'aria-label': close
                })
                    .prepend(
                        $('<span />', {
                            'class': 'ui-icon ui-icon-close',
                            'html': '&times;'
                        })
                    );
            }

            // Create button and setup attributes
            elements.button.appendTo(elements.titlebar || tooltip)
                .attr('role', 'button')
                .click(function (event) {
                    if (!tooltip.hasClass(CLASS_DISABLED)) {
                        self.hide(event);
                    }
                    return FALSE;
                });
        };

        PROTOTYPE._updateButton = function (button) {
            // Make sure tooltip is rendered and if not, return
            if (!this.rendered) {
                return FALSE;
            }

            var elem = this.elements.button;
            if (button) {
                this._createButton();
            }
            else {
                elem.remove();
            }
        };

        // Widget class creator
        function createWidgetClass(cls) {
            return WIDGET.concat('').join(cls ? '-' + cls + ' ' : ' ');
        }

// Widget class setter method
        PROTOTYPE._setWidget = function () {
            var on = this.options.style.widget,
                elements = this.elements,
                tooltip = elements.tooltip,
                disabled = tooltip.hasClass(CLASS_DISABLED);

            tooltip.removeClass(CLASS_DISABLED);
            CLASS_DISABLED = on ? 'ui-state-disabled' : 'loltip-disabled';
            tooltip.toggleClass(CLASS_DISABLED, disabled);

            tooltip.toggleClass('ui-helper-reset ' + createWidgetClass(), on).toggleClass(CLASS_DEFAULT, this.options.style.def && !on);

            if (elements.content) {
                elements.content.toggleClass(createWidgetClass('content'), on);
            }
            if (elements.titlebar) {
                elements.titlebar.toggleClass(createWidgetClass('header'), on);
            }
            if (elements.button) {
                elements.button.toggleClass(NAMESPACE + '-icon', !on);
            }
        };
        function cloneEvent(event) {
            return event && {
                type: event.type,
                pageX: event.pageX,
                pageY: event.pageY,
                target: event.target,
                relatedTarget: event.relatedTarget,
                scrollX: event.scrollX || window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft,
                scrollY: event.scrollY || window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop
            } || {};
        }

        function delay(callback, duration) {
            // If tooltip has displayed, start hide timer
            if (duration > 0) {
                return setTimeout(
                    $.proxy(callback, this), duration
                );
            }
            else {
                callback.call(this);
            }
        }

        function showMethod(event) {
            if (this.tooltip.hasClass(CLASS_DISABLED)) {
                return FALSE;
            }

            // Clear hide timers
            clearTimeout(this.timers.show);
            clearTimeout(this.timers.hide);

            // Start show timer
            this.timers.show = delay.call(this,
                function () {
                    this.toggle(TRUE, event);
                },
                this.options.show.delay
            );
        }

        function hideMethod(event) {
            if (this.tooltip.hasClass(CLASS_DISABLED)) {
                return FALSE;
            }

            // Check if new target was actually the tooltip element
            var relatedTarget = $(event.relatedTarget),
                ontoTooltip = relatedTarget.closest(SELECTOR)[0] === this.tooltip[0],
                ontoTarget = relatedTarget[0] === this.options.show.target[0];

            // Clear timers and stop animation queue
            clearTimeout(this.timers.show);
            clearTimeout(this.timers.hide);

            // Prevent hiding if tooltip is fixed and event target is the tooltip.
            // Or if mouse positioning is enabled and cursor momentarily overlaps
            if (this !== relatedTarget[0] &&
                (this.options.position.target === 'mouse' && ontoTooltip) ||
                (this.options.hide.fixed && (
                    (/mouse(out|leave|move)/).test(event.type) && (ontoTooltip || ontoTarget))
                    )) {
                try {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                } catch (e) {
                }

                return;
            }

            // If tooltip has displayed, start hide timer
            this.timers.hide = delay.call(this,
                function () {
                    this.toggle(FALSE, event);
                },
                this.options.hide.delay,
                this
            );
        }

        function inactiveMethod(event) {
            if (this.tooltip.hasClass(CLASS_DISABLED) || !this.options.hide.inactive) {
                return FALSE;
            }

            // Clear timer
            clearTimeout(this.timers.inactive);

            this.timers.inactive = delay.call(this,
                function () {
                    this.hide(event);
                },
                this.options.hide.inactive
            );
        }

        function repositionMethod(event) {
            if (this.rendered && this.tooltip[0].offsetWidth > 0) {
                this.reposition(event);
            }
        }

// Store mouse coordinates
        PROTOTYPE._storeMouse = function (event) {
            (this.mouse = cloneEvent(event)).type = 'mousemove';
        };

// Bind events
        PROTOTYPE._bind = function (targets, events, method, suffix, context) {
            var ns = '.' + this._id + (suffix ? '-' + suffix : '');
            events.length && $(targets).bind(
                (events.split ? events : events.join(ns + ' ')) + ns,
                $.proxy(method, context || this)
            );
        };
        PROTOTYPE._unbind = function (targets, suffix) {
            $(targets).unbind('.' + this._id + (suffix ? '-' + suffix : ''));
        };

// Apply common event handlers using delegate (avoids excessive .bind calls!)
        var ns = '.' + NAMESPACE;

        function delegate(selector, events, method) {
            $(document.body).delegate(selector,
                (events.split ? events : events.join(ns + ' ')) + ns,
                function () {
                    var api = LOLTIP.api[ $.attr(this, ATTR_ID) ];
                    api && !api.disabled && method.apply(api, arguments);
                }
            );
        }

        $(function () {
            delegate(SELECTOR, ['mouseenter', 'mouseleave'], function (event) {
                var state = event.type === 'mouseenter',
                    tooltip = $(event.currentTarget),
                    target = $(event.relatedTarget || event.target),
                    options = this.options;

                // On mouseenter...
                if (state) {
                    // Focus the tooltip on mouseenter (z-index stacking)
                    this.focus(event);

                    // Clear hide timer on tooltip hover to prevent it from closing
                    tooltip.hasClass(CLASS_FIXED) && !tooltip.hasClass(CLASS_DISABLED) && clearTimeout(this.timers.hide);
                }

                // On mouseleave...
                else {
                    // Hide when we leave the tooltip and not onto the show target (if a hide event is set)
                    if (options.position.target === 'mouse' && options.hide.event &&
                        options.show.target && !target.closest(options.show.target[0]).length) {
                        this.hide(event);
                    }
                }

                // Add hover class
                tooltip.toggleClass(CLASS_HOVER, state);
            });

            // Define events which reset the 'inactive' event handler
            delegate('[' + ATTR_ID + ']', INACTIVE_EVENTS, inactiveMethod);
        });

// Event trigger
        PROTOTYPE._trigger = function (type, args, event) {
            var callback = $.Event('tooltip' + type);
            callback.originalEvent = (event && $.extend({}, event)) || this.cache.event || NULL;

            this.triggering = type;
            this.tooltip.trigger(callback, [this].concat(args || []));
            this.triggering = FALSE;

            return !callback.isDefaultPrevented();
        };

        PROTOTYPE._bindEvents = function (showEvents, hideEvents, showTarget, hideTarget, showMethod, hideMethod) {
            // If hide and show targets are the same...
            if (hideTarget.add(showTarget).length === hideTarget.length) {
                var toggleEvents = [];

                // Filter identical show/hide events
                hideEvents = $.map(hideEvents, function (type) {
                    var showIndex = $.inArray(type, showEvents);

                    // Both events are identical, remove from both hide and show events
                    // and append to toggleEvents
                    if (showIndex > -1) {
                        toggleEvents.push(showEvents.splice(showIndex, 1)[0]);
                        return;
                    }

                    return type;
                });

                // Toggle events are special case of identical show/hide events, which happen in sequence
                toggleEvents.length && this._bind(showTarget, toggleEvents, function (event) {
                    var state = this.rendered ? this.tooltip[0].offsetWidth > 0 : false;
                    (state ? hideMethod : showMethod).call(this, event);
                });
            }

            // Apply show/hide/toggle events
            this._bind(showTarget, showEvents, showMethod);
            this._bind(hideTarget, hideEvents, hideMethod);
        };

        PROTOTYPE._assignInitialEvents = function (event) {
            var options = this.options,
                showTarget = options.show.target,
                hideTarget = options.hide.target,
                showEvents = options.show.event ? $.trim('' + options.show.event).split(' ') : [],
                hideEvents = options.hide.event ? $.trim('' + options.hide.event).split(' ') : [];

            /*
             * Make sure hoverIntent functions properly by using mouseleave as a hide event if
             * mouseenter/mouseout is used for show.event, even if it isn't in the users options.
             */
            if (/mouse(over|enter)/i.test(options.show.event) && !/mouse(out|leave)/i.test(options.hide.event)) {
                hideEvents.push('mouseleave');
            }

            /*
             * Also make sure initial mouse targetting works correctly by caching mousemove coords
             * on show targets before the tooltip has rendered. Also set onTarget when triggered to
             * keep mouse tracking working.
             */
            this._bind(showTarget, 'mousemove', function (event) {
                this._storeMouse(event);
                this.cache.onTarget = TRUE;
            });

            // Define hoverIntent function
            function hoverIntent(event) {
                // Only continue if tooltip isn't disabled
                if (this.disabled || this.destroyed) {
                    return FALSE;
                }

                // Cache the event data
                this.cache.event = cloneEvent(event);
                this.cache.target = event ? $(event.target) : [undefined];

                // Start the event sequence
                clearTimeout(this.timers.show);
                this.timers.show = delay.call(this,
                    function () {
                        this.render(typeof event === 'object' || options.show.ready);
                    },
                    options.show.delay
                );
            }

            // Filter and bind events
            this._bindEvents(showEvents, hideEvents, showTarget, hideTarget, hoverIntent, function () {
                clearTimeout(this.timers.show);
            });

            // Prerendering is enabled, create tooltip now
            if (options.show.ready || options.prerender) {
                hoverIntent.call(this, event);
            }
        };

// Event assignment method
        PROTOTYPE._assignEvents = function () {
            var self = this,
                options = this.options,
                posOptions = options.position,

                tooltip = this.tooltip,
                showTarget = options.show.target,
                hideTarget = options.hide.target,
                containerTarget = posOptions.container,
                viewportTarget = posOptions.viewport,
                documentTarget = $(document),
                bodyTarget = $(document.body),
                windowTarget = $(window),

                showEvents = options.show.event ? $.trim('' + options.show.event).split(' ') : [],
                hideEvents = options.hide.event ? $.trim('' + options.hide.event).split(' ') : [];


            // Assign passed event callbacks
            $.each(options.events, function (name, callback) {
                self._bind(tooltip, name === 'toggle' ? ['tooltipshow', 'tooltiphide'] : ['tooltip' + name], callback, null, tooltip);
            });

            // Hide tooltips when leaving current window/frame (but not select/option elements)
            if (/mouse(out|leave)/i.test(options.hide.event) && options.hide.leave === 'window') {
                this._bind(documentTarget, ['mouseout', 'blur'], function (event) {
                    if (!/select|option/.test(event.target.nodeName) && !event.relatedTarget) {
                        this.hide(event);
                    }
                });
            }

            // Enable hide.fixed by adding appropriate class
            if (options.hide.fixed) {
                hideTarget = hideTarget.add(tooltip.addClass(CLASS_FIXED));
            }

            /*
             * Make sure hoverIntent functions properly by using mouseleave to clear show timer if
             * mouseenter/mouseout is used for show.event, even if it isn't in the users options.
             */
            else if (/mouse(over|enter)/i.test(options.show.event)) {
                this._bind(hideTarget, 'mouseleave', function () {
                    clearTimeout(this.timers.show);
                });
            }

            // Hide tooltip on document mousedown if unfocus events are enabled
            if (('' + options.hide.event).indexOf('unfocus') > -1) {
                this._bind(containerTarget.closest('html'), ['mousedown', 'touchstart'], function (event) {
                    var elem = $(event.target),
                        enabled = this.rendered && !this.tooltip.hasClass(CLASS_DISABLED) && this.tooltip[0].offsetWidth > 0,
                        isAncestor = elem.parents(SELECTOR).filter(this.tooltip[0]).length > 0;

                    if (elem[0] !== this.target[0] && elem[0] !== this.tooltip[0] && !isAncestor && !this.target.has(elem[0]).length && enabled
                        ) {
                        this.hide(event);
                    }
                });
            }

            // Check if the tooltip hides when inactive
            if ('number' === typeof options.hide.inactive) {
                // Bind inactive method to show target(s) as a custom event
                this._bind(showTarget, 'loltip-' + this.id + '-inactive', inactiveMethod);

                // Define events which reset the 'inactive' event handler
                this._bind(hideTarget.add(tooltip), LOLTIP.inactiveEvents, inactiveMethod, '-inactive');
            }

            // Filter and bind events
            this._bindEvents(showEvents, hideEvents, showTarget, hideTarget, showMethod, hideMethod);

            // Mouse movement bindings
            this._bind(showTarget.add(tooltip), 'mousemove', function (event) {
                // Check if the tooltip hides when mouse is moved a certain distance
                if ('number' === typeof options.hide.distance) {
                    var origin = this.cache.origin || {},
                        limit = this.options.hide.distance,
                        abs = Math.abs;

                    // Check if the movement has gone beyond the limit, and hide it if so
                    if (abs(event.pageX - origin.pageX) >= limit || abs(event.pageY - origin.pageY) >= limit) {
                        this.hide(event);
                    }
                }

                // Cache mousemove coords on show targets
                this._storeMouse(event);
            });

            // Mouse positioning events
            if (posOptions.target === 'mouse') {
                // If mouse adjustment is on...
                if (posOptions.adjust.mouse) {
                    // Apply a mouseleave event so we don't get problems with overlapping
                    if (options.hide.event) {
                        // Track if we're on the target or not
                        this._bind(showTarget, ['mouseenter', 'mouseleave'], function (event) {
                            this.cache.onTarget = event.type === 'mouseenter';
                        });
                    }

                    // Update tooltip position on mousemove
                    this._bind(documentTarget, 'mousemove', function (event) {
                        // Update the tooltip position only if the tooltip is visible and adjustment is enabled
                        if (this.rendered && this.cache.onTarget && !this.tooltip.hasClass(CLASS_DISABLED) && this.tooltip[0].offsetWidth > 0) {
                            this.reposition(event);
                        }
                    });
                }
            }

            // Adjust positions of the tooltip on window resize if enabled
            if (posOptions.adjust.resize || viewportTarget.length) {
                this._bind($.event.special.resize ? viewportTarget : windowTarget, 'resize', repositionMethod);
            }

            // Adjust tooltip position on scroll of the window or viewport element if present
            if (posOptions.adjust.scroll) {
                this._bind(windowTarget.add(posOptions.container), 'scroll', repositionMethod);
            }
        };

// Un-assignment method
        PROTOTYPE._unassignEvents = function () {
            var targets = [
                this.options.show.target[0],
                this.options.hide.target[0],
                this.rendered && this.tooltip[0],
                this.options.position.container[0],
                this.options.position.viewport[0],
                this.options.position.container.closest('html')[0], // unfocus
                window,
                document
            ];

            this._unbind($([]).pushStack($.grep(targets, function (i) {
                return typeof i === 'object';
            })));
        };

        // Initialization method
        function init(elem, id, opts) {
            var obj, posOptions, attr, config, title,

            // Setup element references
                docBody = $(document.body),

            // Use document body instead of document element if needed
                newTarget = elem[0] === document ? docBody : elem,

            // Grab metadata from element if plugin is present
                metadata = (elem.metadata) ? elem.metadata(opts.metadata) : NULL,

            // If metadata type if HTML5, grab 'name' from the object instead, or use the regular data object otherwise
                metadata5 = opts.metadata.type === 'html5' && metadata ? metadata[opts.metadata.name] : NULL,

            // Grab data from metadata.name (or data-loltipopts as fallback) using .data() method,
                html5 = elem.data(opts.metadata.name || 'loltipopts');

            // If we don't get an object returned attempt to parse it manualyl without parseJSON
            try {
                html5 = typeof html5 === 'string' ? $.parseJSON(html5) : html5;
            } catch (e) {
            }

            // Merge in and sanitize metadata
            config = $.extend(TRUE, {}, LOLTIP.defaults, opts,
                typeof html5 === 'object' ? sanitizeOptions(html5) : NULL,
                sanitizeOptions(metadata5 || metadata));

            // Re-grab our positioning options now we've merged our metadata and set id to passed value
            posOptions = config.position;
            config.id = id;

            // Setup missing content if none is detected
            if ('boolean' === typeof config.content.text) {
                attr = elem.attr(config.content.attr);

                // Grab from supplied attribute if available
                if (config.content.attr !== FALSE && attr) {
                    config.content.text = attr;
                }

                // No valid content was found, abort render
                else {
                    return FALSE;
                }
            }

            // Setup target options
            if (!posOptions.container.length) {
                posOptions.container = docBody;
            }
            if (posOptions.target === FALSE) {
                posOptions.target = newTarget;
            }
            if (config.show.target === FALSE) {
                config.show.target = newTarget;
            }
            if (config.show.solo === TRUE) {
                config.show.solo = posOptions.container.closest('body');
            }
            if (config.hide.target === FALSE) {
                config.hide.target = newTarget;
            }
            if (config.position.viewport === TRUE) {
                config.position.viewport = posOptions.container;
            }

            // Ensure we only use a single container
            posOptions.container = posOptions.container.eq(0);

            // Convert position corner values into x and y strings
            posOptions.at = new CORNER(posOptions.at, TRUE);
            posOptions.my = new CORNER(posOptions.my);

            // Destroy previous tooltip if overwrite is enabled, or skip element if not
            if (elem.data(NAMESPACE)) {
                if (config.overwrite) {
                    elem.loltip('destroy', true);
                }
                else if (config.overwrite === FALSE) {
                    return FALSE;
                }
            }

            // Add has-loltip attribute
            elem.attr(ATTR_HAS, id);

            // Remove title attribute and store it if present
            if (config.suppress && (title = elem.attr('title'))) {
                // Final attr call fixes event delegatiom and IE default tooltip showing problem
                elem.removeAttr('title').attr(oldtitle, title).attr('title', '');
            }

            // Initialize the tooltip and add API reference
            obj = new Loltip(elem, config, id, !!attr);
            elem.data(NAMESPACE, obj);

            // Catch remove/removeloltip events on target element to destroy redundant tooltip
            elem.one('remove.loltip-' + id + ' removeloltip.loltip-' + id, function () {
                var api;
                if ((api = $(this).data(NAMESPACE))) {
                    api.destroy(true);
                }
            });

            return obj;
        }

// jQuery $.fn extension method
        LOLTIP = $.fn.loltip = function (options, notation, newValue) {
            var command = ('' + options).toLowerCase(), // Parse command
                returned = NULL,
                args = $.makeArray(arguments).slice(1),
                event = args[args.length - 1],
                opts = this[0] ? $.data(this[0], NAMESPACE) : NULL;

            // Check for API request
            if ((!arguments.length && opts) || command === 'api') {
                return opts;
            }

            // Execute API command if present
            else if ('string' === typeof options) {
                this.each(function () {
                    var api = $.data(this, NAMESPACE);
                    if (!api) {
                        return TRUE;
                    }

                    // Cache the event if possible
                    if (event && event.timeStamp) {
                        api.cache.event = event;
                    }

                    // Check for specific API commands
                    if (notation && (command === 'option' || command === 'options')) {
                        if (newValue !== undefined || $.isPlainObject(notation)) {
                            api.set(notation, newValue);
                        }
                        else {
                            returned = api.get(notation);
                            return FALSE;
                        }
                    }

                    // Execute API command
                    else if (api[command]) {
                        api[command].apply(api, args);
                    }
                });

                return returned !== NULL ? returned : this;
            }

            // No API commands. validate provided options and setup loltips
            else if ('object' === typeof options || !arguments.length) {
                // Sanitize options first
                opts = sanitizeOptions($.extend(TRUE, {}, options));

                return this.each(function (i) {
                    var api, id;

                    // Find next available ID, or use custom ID if provided
                    id = $.isArray(opts.id) ? opts.id[i] : opts.id;
                    id = !id || id === FALSE || id.length < 1 || LOLTIP.api[id] ? LOLTIP.nextid++ : id;

                    // Initialize the loltip and re-grab newly sanitized options
                    api = init($(this), id, opts);
                    if (api === FALSE) {
                        return TRUE;
                    }
                    else {
                        LOLTIP.api[id] = api;
                    }

                    // Initialize plugins
                    $.each(PLUGINS, function () {
                        if (this.initialize === 'initialize') {
                            this(api);
                        }
                    });

                    // Assign initial pre-render events
                    api._assignInitialEvents(event);
                });
            }
        };

// Expose class
        $.loltip = Loltip;

// Populated in render method
        LOLTIP.api = {};
        $.each({
            /* Allow other plugins to successfully retrieve the title of an element with a loltip applied */
            attr: function (attr, val) {
                if (this.length) {
                    var self = this[0],
                        title = 'title',
                        api = $.data(self, 'loltip');

                    if (attr === title && api && 'object' === typeof api && api.options.suppress) {
                        if (arguments.length < 2) {
                            return $.attr(self, oldtitle);
                        }

                        // If loltip is rendered and title was originally used as content, update it
                        if (api && api.options.content.attr === title && api.cache.attr) {
                            api.set('content.text', val);
                        }

                        // Use the regular attr method to set, then cache the result
                        return this.attr(oldtitle, val);
                    }
                }

                return $.fn['attr' + replaceSuffix].apply(this, arguments);
            },

            /* Allow clone to correctly retrieve cached title attributes */
            clone: function (keepData) {
                var titles = $([]), title = 'title',

                // Clone our element using the real clone method
                    elems = $.fn['clone' + replaceSuffix].apply(this, arguments);

                // Grab all elements with an oldtitle set, and change it to regular title attribute, if keepData is false
                if (!keepData) {
                    elems.filter('[' + oldtitle + ']').attr('title', function () {
                        return $.attr(this, oldtitle);
                    })
                        .removeAttr(oldtitle);
                }

                return elems;
            }
        }, function (name, func) {
            if (!func || $.fn[name + replaceSuffix]) {
                return TRUE;
            }

            var old = $.fn[name + replaceSuffix] = $.fn[name];
            $.fn[name] = function () {
                return func.apply(this, arguments) || old.apply(this, arguments);
            };
        });

        /* Fire off 'removeloltip' handler in $.cleanData if jQuery UI not present (it already does similar).
         * This snippet is taken directly from jQuery UI source code found here:
         *     http://code.jquery.com/ui/jquery-ui-git.js
         */
        if (!$.ui) {
            $['cleanData' + replaceSuffix] = $.cleanData;
            $.cleanData = function (elems) {
                for (var i = 0, elem; (elem = $(elems[i])).length; i++) {
                    if (elem.attr(ATTR_HAS)) {
                        try {
                            elem.triggerHandler('removeloltip');
                        }
                        catch (e) {
                        }
                    }
                }
                $['cleanData' + replaceSuffix].apply(this, arguments);
            };
        }

        // loltip version
        LOLTIP.version = '2.2.0';

// Base ID for all loltips
        LOLTIP.nextid = 0;

// Inactive events array
        LOLTIP.inactiveEvents = INACTIVE_EVENTS;

// Base z-index for all loltips
        LOLTIP.zindex = 15000;

// Define configuration defaults
        LOLTIP.defaults = {
            prerender: FALSE,
            id: FALSE,
            overwrite: TRUE,
            suppress: TRUE,
            content: {
                text: TRUE,
                attr: 'title',
                title: FALSE,
                button: FALSE
            },
            position: {
                my: 'top left',
                at: 'bottom right',
                target: FALSE,
                container: FALSE,
                viewport: FALSE,
                adjust: {
                    x: 0, y: 0,
                    mouse: TRUE,
                    scroll: TRUE,
                    resize: TRUE,
                    method: 'flipinvert flipinvert'
                },
                effect: function (api, pos, viewport) {
                    $(this).animate(pos, {
                        duration: 200,
                        queue: FALSE
                    });
                }
            },
            show: {
                target: FALSE,
                event: 'mouseenter',
                effect: TRUE,
                delay: 90,
                solo: FALSE,
                ready: FALSE,
                autofocus: FALSE
            },
            hide: {
                target: FALSE,
                event: 'mouseleave',
                effect: TRUE,
                delay: 0,
                fixed: FALSE,
                inactive: FALSE,
                leave: 'window',
                distance: FALSE
            },
            style: {
                classes: '',
                widget: FALSE,
                width: FALSE,
                height: FALSE,
                def: TRUE
            },
            events: {
                render: NULL,
                move: NULL,
                show: NULL,
                hide: NULL,
                toggle: NULL,
                visible: NULL,
                hidden: NULL,
                focus: NULL,
                blur: NULL
            }
        };

        var TIP,

// .bind()/.on() namespace
            TIPNS = '.loltip-tip',

// Common CSS strings
            MARGIN = 'margin',
            BORDER = 'border',
            COLOR = 'color',
            BG_COLOR = 'background-color',
            TRANSPARENT = 'transparent',
            IMPORTANT = ' !important',

// Check if the browser supports <canvas/> elements
            HASCANVAS = !!document.createElement('canvas').getContext,

// Invalid colour values used in parseColours()
            INVALID = /rgba?\(0, 0, 0(, 0)?\)|transparent|#123456/i;

// Camel-case method, taken from jQuery source
// http://code.jquery.com/jquery-1.8.0.js
        function camel(s) {
            return s.charAt(0).toUpperCase() + s.slice(1);
        }

        /*
         * Modified from Modernizr's testPropsAll()
         * http://modernizr.com/downloads/modernizr-latest.js
         */
        var cssProps = {}, cssPrefixes = ["Webkit", "O", "Moz", "ms"];

        function vendorCss(elem, prop) {
            var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1),
                props = (prop + ' ' + cssPrefixes.join(ucProp + ' ') + ucProp).split(' '),
                cur, val, i = 0;

            // If the property has already been mapped...
            if (cssProps[prop]) {
                return elem.css(cssProps[prop]);
            }

            while ((cur = props[i++])) {
                if ((val = elem.css(cur)) !== undefined) {
                    return cssProps[prop] = cur, val;
                }
            }
        }

// Parse a given elements CSS property into an int
        function intCss(elem, prop) {
            return Math.ceil(parseFloat(vendorCss(elem, prop)));
        }


// VML creation (for IE only)
        if (!HASCANVAS) {
            var createVML = function (tag, props, style) {
                return '<loltipvml:' + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="loltip-vml" ' + (props || '') +
                    ' style="behavior: url(#default#VML); ' + (style || '') + '" />';
            };
        }

// Canvas only definitions
        else {
            var PIXEL_RATIO = window.devicePixelRatio || 1,
                BACKING_STORE_RATIO = (function () {
                    var context = document.createElement('canvas').getContext('2d');
                    return context.backingStorePixelRatio || context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio ||
                        context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || 1;
                }()),
                SCALE = PIXEL_RATIO / BACKING_STORE_RATIO;
        }


        function Tip(loltip, options) {
            this._ns = 'tip';
            this.options = options;
            this.offset = options.offset;
            this.size = [ options.width, options.height ];

            // Initialize
            this.init((this.loltip = loltip));
        }

        $.extend(Tip.prototype, {
            init: function (loltip) {
                var context, tip;

                // Create tip element and prepend to the tooltip
                tip = this.element = loltip.elements.tip = $('<div />', { 'class': NAMESPACE + '-tip' }).prependTo(loltip.tooltip);

                // Create tip drawing element(s)
                if (HASCANVAS) {
                    // save() as soon as we create the canvas element so FF2 doesn't bork on our first restore()!
                    context = $('<canvas />').appendTo(this.element)[0].getContext('2d');

                    // Setup constant parameters
                    context.lineJoin = 'miter';
                    context.miterLimit = 100000;
                    context.save();
                }
                else {
                    context = createVML('shape', 'coordorigin="0,0"', 'position:absolute;');
                    this.element.html(context + context);

                    // Prevent mousing down on the tip since it causes problems with .live() handling in IE due to VML
                    loltip._bind($('*', tip).add(tip), ['click', 'mousedown'], function (event) {
                        event.stopPropagation();
                    }, this._ns);
                }

                // Bind update events
                loltip._bind(loltip.tooltip, 'tooltipmove', this.reposition, this._ns, this);

                // Create it
                this.create();
            },

            _swapDimensions: function () {
                this.size[0] = this.options.height;
                this.size[1] = this.options.width;
            },
            _resetDimensions: function () {
                this.size[0] = this.options.width;
                this.size[1] = this.options.height;
            },

            _useTitle: function (corner) {
                var titlebar = this.loltip.elements.titlebar;
                return titlebar && (
                    corner.y === TOP || (corner.y === CENTER && this.element.position().top + (this.size[1] / 2) + this.options.offset < titlebar.outerHeight(TRUE))
                    );
            },

            _parseCorner: function (corner) {
                var my = this.loltip.options.position.my;

                // Detect corner and mimic properties
                if (corner === FALSE || my === FALSE) {
                    corner = FALSE;
                }
                else if (corner === TRUE) {
                    corner = new CORNER(my.string());
                }
                else if (!corner.string) {
                    corner = new CORNER(corner);
                    corner.fixed = TRUE;
                }

                return corner;
            },

            _parseWidth: function (corner, side, use) {
                var elements = this.loltip.elements,
                    prop = BORDER + camel(side) + 'Width';

                return (use ? intCss(use, prop) : (
                    intCss(elements.content, prop) ||
                        intCss(this._useTitle(corner) && elements.titlebar || elements.content, prop) ||
                        intCss(elements.tooltip, prop)
                    )) || 0;
            },

            _parseRadius: function (corner) {
                var elements = this.loltip.elements,
                    prop = BORDER + camel(corner.y) + camel(corner.x) + 'Radius';

                return BROWSER.ie < 9 ? 0 :
                    intCss(this._useTitle(corner) && elements.titlebar || elements.content, prop) ||
                        intCss(elements.tooltip, prop) || 0;
            },

            _invalidColour: function (elem, prop, compare) {
                var val = elem.css(prop);
                return !val || (compare && val === elem.css(compare)) || INVALID.test(val) ? FALSE : val;
            },

            _parseColours: function (corner) {
                var elements = this.loltip.elements,
                    tip = this.element.css('cssText', ''),
                    borderSide = BORDER + camel(corner[ corner.precedance ]) + camel(COLOR),
                    colorElem = this._useTitle(corner) && elements.titlebar || elements.content,
                    css = this._invalidColour, color = [];

                // Attempt to detect the background colour from various elements, left-to-right precedance
                color[0] = css(tip, BG_COLOR) || css(colorElem, BG_COLOR) || css(elements.content, BG_COLOR) ||
                    css(elements.tooltip, BG_COLOR) || tip.css(BG_COLOR);

                // Attempt to detect the correct border side colour from various elements, left-to-right precedance
                color[1] = css(tip, borderSide, COLOR) || css(colorElem, borderSide, COLOR) ||
                    css(elements.content, borderSide, COLOR) || css(elements.tooltip, borderSide, COLOR) || elements.tooltip.css(borderSide);

                // Reset background and border colours
                $('*', tip).add(tip).css('cssText', BG_COLOR + ':' + TRANSPARENT + IMPORTANT + ';' + BORDER + ':0' + IMPORTANT + ';');

                return color;
            },

            _calculateSize: function (corner) {
                var y = corner.precedance === Y,
                    width = this.options['width'],
                    height = this.options['height'],
                    isCenter = corner.abbrev() === 'c',
                    base = (y ? width : height) * (isCenter ? 0.5 : 1),
                    pow = Math.pow,
                    round = Math.round,
                    bigHyp, ratio, result,

                    smallHyp = Math.sqrt(pow(base, 2) + pow(height, 2)),
                    hyp = [ (this.border / base) * smallHyp, (this.border / height) * smallHyp ];

                hyp[2] = Math.sqrt(pow(hyp[0], 2) - pow(this.border, 2));
                hyp[3] = Math.sqrt(pow(hyp[1], 2) - pow(this.border, 2));

                bigHyp = smallHyp + hyp[2] + hyp[3] + (isCenter ? 0 : hyp[0]);
                ratio = bigHyp / smallHyp;

                result = [ round(ratio * width), round(ratio * height) ];
                return y ? result : result.reverse();
            },

            // Tip coordinates calculator
            _calculateTip: function (corner, size, scale) {
                scale = scale || 1;
                size = size || this.size;

                var width = size[0] * scale,
                    height = size[1] * scale,
                    width2 = Math.ceil(width / 2), height2 = Math.ceil(height / 2),

                // Define tip coordinates in terms of height and width values
                    tips = {
                        br: [0, 0, width, height, width, 0],
                        bl: [0, 0, width, 0, 0, height],
                        tr: [0, height, width, 0, width, height],
                        tl: [0, 0, 0, height, width, height],
                        tc: [0, height, width2, 0, width, height],
                        bc: [0, 0, width, 0, width2, height],
                        rc: [0, 0, width, height2, 0, height],
                        lc: [width, 0, width, height, 0, height2]
                    };

                // Set common side shapes
                tips.lt = tips.br;
                tips.rt = tips.bl;
                tips.lb = tips.tr;
                tips.rb = tips.tl;

                return tips[ corner.abbrev() ];
            },

            // Tip coordinates drawer (canvas)
            _drawCoords: function (context, coords) {
                context.beginPath();
                context.moveTo(coords[0], coords[1]);
                context.lineTo(coords[2], coords[3]);
                context.lineTo(coords[4], coords[5]);
                context.closePath();
            },

            create: function () {
                // Determine tip corner
                var c = this.corner = (HASCANVAS || BROWSER.ie) && this._parseCorner(this.options.corner);

                // If we have a tip corner...
                if ((this.enabled = !!this.corner && this.corner.abbrev() !== 'c')) {
                    // Cache it
                    this.loltip.cache.corner = c.clone();

                    // Create it
                    this.update();
                }

                // Toggle tip element
                this.element.toggle(this.enabled);

                return this.corner;
            },

            update: function (corner, position) {
                if (!this.enabled) {
                    return this;
                }

                var elements = this.loltip.elements,
                    tip = this.element,
                    inner = tip.children(),
                    options = this.options,
                    curSize = this.size,
                    mimic = options.mimic,
                    round = Math.round,
                    color, precedance, context,
                    coords, bigCoords, translate, newSize, border, BACKING_STORE_RATIO;

                // Re-determine tip if not already set
                if (!corner) {
                    corner = this.loltip.cache.corner || this.corner;
                }

                // Use corner property if we detect an invalid mimic value
                if (mimic === FALSE) {
                    mimic = corner;
                }

                // Otherwise inherit mimic properties from the corner object as necessary
                else {
                    mimic = new CORNER(mimic);
                    mimic.precedance = corner.precedance;

                    if (mimic.x === 'inherit') {
                        mimic.x = corner.x;
                    }
                    else if (mimic.y === 'inherit') {
                        mimic.y = corner.y;
                    }
                    else if (mimic.x === mimic.y) {
                        mimic[ corner.precedance ] = corner[ corner.precedance ];
                    }
                }
                precedance = mimic.precedance;

                // Ensure the tip width.height are relative to the tip position
                if (corner.precedance === X) {
                    this._swapDimensions();
                }
                else {
                    this._resetDimensions();
                }

                // Update our colours
                color = this.color = this._parseColours(corner);

                // Detect border width, taking into account colours
                if (color[1] !== TRANSPARENT) {
                    // Grab border width
                    border = this.border = this._parseWidth(corner, corner[corner.precedance]);

                    // If border width isn't zero, use border color as fill if it's not invalid (1.0 style tips)
                    if (options.border && border < 1 && !INVALID.test(color[1])) {
                        color[0] = color[1];
                    }

                    // Set border width (use detected border width if options.border is true)
                    this.border = border = options.border !== TRUE ? options.border : border;
                }

                // Border colour was invalid, set border to zero
                else {
                    this.border = border = 0;
                }

                // Determine tip size
                newSize = this.size = this._calculateSize(corner);
                tip.css({
                    width: newSize[0],
                    height: newSize[1],
                    lineHeight: newSize[1] + 'px'
                });

                // Calculate tip translation
                if (corner.precedance === Y) {
                    translate = [
                        round(mimic.x === LEFT ? border : mimic.x === RIGHT ? newSize[0] - curSize[0] - border : (newSize[0] - curSize[0]) / 2),
                        round(mimic.y === TOP ? newSize[1] - curSize[1] : 0)
                    ];
                }
                else {
                    translate = [
                        round(mimic.x === LEFT ? newSize[0] - curSize[0] : 0),
                        round(mimic.y === TOP ? border : mimic.y === BOTTOM ? newSize[1] - curSize[1] - border : (newSize[1] - curSize[1]) / 2)
                    ];
                }

                // Canvas drawing implementation
                if (HASCANVAS) {
                    // Grab canvas context and clear/save it
                    context = inner[0].getContext('2d');
                    context.restore();
                    context.save();
                    context.clearRect(0, 0, 6000, 6000);

                    // Calculate coordinates
                    coords = this._calculateTip(mimic, curSize, SCALE);
                    bigCoords = this._calculateTip(mimic, this.size, SCALE);

                    // Set the canvas size using calculated size
                    inner.attr(WIDTH, newSize[0] * SCALE).attr(HEIGHT, newSize[1] * SCALE);
                    inner.css(WIDTH, newSize[0]).css(HEIGHT, newSize[1]);

                    // Draw the outer-stroke tip
                    this._drawCoords(context, bigCoords);
                    context.fillStyle = color[1];
                    context.fill();

                    // Draw the actual tip
                    context.translate(translate[0] * SCALE, translate[1] * SCALE);
                    this._drawCoords(context, coords);
                    context.fillStyle = color[0];
                    context.fill();
                }

                // VML (IE Proprietary implementation)
                else {
                    // Calculate coordinates
                    coords = this._calculateTip(mimic);

                    // Setup coordinates string
                    coords = 'm' + coords[0] + ',' + coords[1] + ' l' + coords[2] +
                        ',' + coords[3] + ' ' + coords[4] + ',' + coords[5] + ' xe';

                    // Setup VML-specific offset for pixel-perfection
                    translate[2] = border && /^(r|b)/i.test(corner.string()) ?
                        BROWSER.ie === 8 ? 2 : 1 : 0;

                    // Set initial CSS
                    inner.css({
                        coordsize: (newSize[0] + border) + ' ' + (newSize[1] + border),
                        antialias: '' + (mimic.string().indexOf(CENTER) > -1),
                        left: translate[0] - (translate[2] * Number(precedance === X)),
                        top: translate[1] - (translate[2] * Number(precedance === Y)),
                        width: newSize[0] + border,
                        height: newSize[1] + border
                    })
                        .each(function (i) {
                            var $this = $(this);

                            // Set shape specific attributes
                            $this[ $this.prop ? 'prop' : 'attr' ]({
                                coordsize: (newSize[0] + border) + ' ' + (newSize[1] + border),
                                path: coords,
                                fillcolor: color[0],
                                filled: !!i,
                                stroked: !i
                            })
                                .toggle(!!(border || i));

                            // Check if border is enabled and add stroke element
                            !i && $this.html(createVML(
                                'stroke', 'weight="' + (border * 2) + 'px" color="' + color[1] + '" miterlimit="1000" joinstyle="miter"'
                            ));
                        });
                }

                // Opera bug #357 - Incorrect tip position
                // https://github.com/Craga89/loltip2/issues/367
                window.opera && setTimeout(function () {
                    elements.tip.css({
                        display: 'inline-block',
                        visibility: 'visible'
                    });
                }, 1);

                // Position if needed
                if (position !== FALSE) {
                    this.calculate(corner, newSize);
                }
            },

            calculate: function (corner, size) {
                if (!this.enabled) {
                    return FALSE;
                }

                var self = this,
                    elements = this.loltip.elements,
                    tip = this.element,
                    userOffset = this.options.offset,
                    isWidget = elements.tooltip.hasClass('ui-widget'),
                    position = {  },
                    precedance, corners;

                // Inherit corner if not provided
                corner = corner || this.corner;
                precedance = corner.precedance;

                // Determine which tip dimension to use for adjustment
                size = size || this._calculateSize(corner);

                // Setup corners and offset array
                corners = [ corner.x, corner.y ];
                if (precedance === X) {
                    corners.reverse();
                }

                // Calculate tip position
                $.each(corners, function (i, side) {
                    var b, bc, br;

                    if (side === CENTER) {
                        b = precedance === Y ? LEFT : TOP;
                        position[ b ] = '50%';
                        position[MARGIN + '-' + b] = -Math.round(size[ precedance === Y ? 0 : 1 ] / 2) + userOffset;
                    }
                    else {
                        b = self._parseWidth(corner, side, elements.tooltip);
                        bc = self._parseWidth(corner, side, elements.content);
                        br = self._parseRadius(corner);

                        position[ side ] = Math.max(-self.border, i ? bc : (userOffset + (br > b ? br : -b)));
                    }
                });

                // Adjust for tip size
                position[ corner[precedance] ] -= size[ precedance === X ? 0 : 1 ];

                // Set and return new position
                tip.css({ margin: '', top: '', bottom: '', left: '', right: '' }).css(position);
                return position;
            },

            reposition: function (event, api, pos, viewport) {
                if (!this.enabled) {
                    return;
                }

                var cache = api.cache,
                    newCorner = this.corner.clone(),
                    adjust = pos.adjusted,
                    method = api.options.position.adjust.method.split(' '),
                    horizontal = method[0],
                    vertical = method[1] || method[0],
                    shift = { left: FALSE, top: FALSE, x: 0, y: 0 },
                    offset, css = {}, props;

                function shiftflip(direction, precedance, popposite, side, opposite) {
                    // Horizontal - Shift or flip method
                    if (direction === SHIFT && newCorner.precedance === precedance && adjust[side] && newCorner[popposite] !== CENTER) {
                        newCorner.precedance = newCorner.precedance === X ? Y : X;
                    }
                    else if (direction !== SHIFT && adjust[side]) {
                        newCorner[precedance] = newCorner[precedance] === CENTER ?
                            (adjust[side] > 0 ? side : opposite) : (newCorner[precedance] === side ? opposite : side);
                    }
                }

                function shiftonly(xy, side, opposite) {
                    if (newCorner[xy] === CENTER) {
                        css[MARGIN + '-' + side] = shift[xy] = offset[MARGIN + '-' + side] - adjust[side];
                    }
                    else {
                        props = offset[opposite] !== undefined ?
                            [ adjust[side], -offset[side] ] : [ -adjust[side], offset[side] ];

                        if ((shift[xy] = Math.max(props[0], props[1])) > props[0]) {
                            pos[side] -= adjust[side];
                            shift[side] = FALSE;
                        }

                        css[ offset[opposite] !== undefined ? opposite : side ] = shift[xy];
                    }
                }

                // If our tip position isn't fixed e.g. doesn't adjust with viewport...
                if (this.corner.fixed !== TRUE) {
                    // Perform shift/flip adjustments
                    shiftflip(horizontal, X, Y, LEFT, RIGHT);
                    shiftflip(vertical, Y, X, TOP, BOTTOM);

                    // Update and redraw the tip if needed (check cached details of last drawn tip)
                    if (newCorner.string() !== cache.corner.string() && (cache.cornerTop !== adjust.top || cache.cornerLeft !== adjust.left)) {
                        this.update(newCorner, FALSE);
                    }
                }

                // Setup tip offset properties
                offset = this.calculate(newCorner);

                // Readjust offset object to make it left/top
                if (offset.right !== undefined) {
                    offset.left = -offset.right;
                }
                if (offset.bottom !== undefined) {
                    offset.top = -offset.bottom;
                }
                offset.user = this.offset;

                // Perform shift adjustments
                if (shift.left = (horizontal === SHIFT && !!adjust.left)) {
                    shiftonly(X, LEFT, RIGHT);
                }
                if (shift.top = (vertical === SHIFT && !!adjust.top)) {
                    shiftonly(Y, TOP, BOTTOM);
                }

                /*
                 * If the tip is adjusted in both dimensions, or in a
                 * direction that would cause it to be anywhere but the
                 * outer border, hide it!
                 */
                this.element.css(css).toggle(
                    !((shift.x && shift.y) || (newCorner.x === CENTER && shift.y) || (newCorner.y === CENTER && shift.x))
                );

                // Adjust position to accomodate tip dimensions
                pos.left -= offset.left.charAt ? offset.user :
                    horizontal !== SHIFT || shift.top || !shift.left && !shift.top ? offset.left + this.border : 0;
                pos.top -= offset.top.charAt ? offset.user :
                    vertical !== SHIFT || shift.left || !shift.left && !shift.top ? offset.top + this.border : 0;

                // Cache details
                cache.cornerLeft = adjust.left;
                cache.cornerTop = adjust.top;
                cache.corner = newCorner.clone();
            },

            destroy: function () {
                // Unbind events
                this.loltip._unbind(this.loltip.tooltip, this._ns);

                // Remove the tip element(s)
                if (this.loltip.elements.tip) {
                    this.loltip.elements.tip.find('*')
                        .remove().end().remove();
                }
            }
        });

        TIP = PLUGINS.tip = function (api) {
            return new Tip(api, api.options.style.tip);
        };

// Initialize tip on render
        TIP.initialize = 'render';

// Setup plugin sanitization options
        TIP.sanitize = function (options) {
            if (options.style && 'tip' in options.style) {
                var opts = options.style.tip;
                if (typeof opts !== 'object') {
                    opts = options.style.tip = { corner: opts };
                }
                if (!(/string|boolean/i).test(typeof opts.corner)) {
                    opts.corner = TRUE;
                }
            }
        };

// Add new option checks for the plugin
        CHECKS.tip = {
            '^position.my|style.tip.(corner|mimic|border)$': function () {
                // Make sure a tip can be drawn
                this.create();

                // Reposition the tooltip
                this.loltip.reposition();
            },
            '^style.tip.(height|width)$': function (obj) {
                // Re-set dimensions and redraw the tip
                this.size = [ obj.width, obj.height ];
                this.update();

                // Reposition the tooltip
                this.loltip.reposition();
            },
            '^content.title|style.(classes|widget)$': function () {
                this.update();
            }
        };

// Extend original loltip defaults
        $.extend(TRUE, LOLTIP.defaults, {
            style: {
                tip: {
                    corner: TRUE,
                    mimic: FALSE,
                    width: 6,
                    height: 6,
                    border: TRUE,
                    offset: 0
                }
            }
        });

        PLUGINS.viewport = function (api, position, posOptions, targetWidth, targetHeight, elemWidth, elemHeight) {
            var target = posOptions.target,
                tooltip = api.elements.tooltip,
                my = posOptions.my,
                at = posOptions.at,
                adjust = posOptions.adjust,
                method = adjust.method.split(' '),
                methodX = method[0],
                methodY = method[1] || method[0],
                viewport = posOptions.viewport,
                container = posOptions.container,
                cache = api.cache,
                adjusted = { left: 0, top: 0 },
                fixed, newMy, newClass, containerOffset, containerStatic,
                viewportWidth, viewportHeight, viewportScroll, viewportOffset;

            // If viewport is not a jQuery element, or it's the window/document, or no adjustment method is used... return
            if (!viewport.jquery || target[0] === window || target[0] === document.body || adjust.method === 'none') {
                return adjusted;
            }

            // Cach container details
            containerOffset = container.offset() || adjusted;
            containerStatic = container.css('position') === 'static';

            // Cache our viewport details
            fixed = tooltip.css('position') === 'fixed';
            viewportWidth = viewport[0] === window ? viewport.width() : viewport.outerWidth(FALSE);
            viewportHeight = viewport[0] === window ? viewport.height() : viewport.outerHeight(FALSE);
            viewportScroll = { left: fixed ? 0 : viewport.scrollLeft(), top: fixed ? 0 : viewport.scrollTop() };
            viewportOffset = viewport.offset() || adjusted;

            // Generic calculation method
            function calculate(side, otherSide, type, adjust, side1, side2, lengthName, targetLength, elemLength) {
                var initialPos = position[side1],
                    mySide = my[side],
                    atSide = at[side],
                    isShift = type === SHIFT,
                    myLength = mySide === side1 ? elemLength : mySide === side2 ? -elemLength : -elemLength / 2,
                    atLength = atSide === side1 ? targetLength : atSide === side2 ? -targetLength : -targetLength / 2,
                    sideOffset = viewportScroll[side1] + viewportOffset[side1] - (containerStatic ? 0 : containerOffset[side1]),
                    overflow1 = sideOffset - initialPos,
                    overflow2 = initialPos + elemLength - (lengthName === WIDTH ? viewportWidth : viewportHeight) - sideOffset,
                    offset = myLength - (my.precedance === side || mySide === my[otherSide] ? atLength : 0) - (atSide === CENTER ? targetLength / 2 : 0);

                // shift
                if (isShift) {
                    offset = (mySide === side1 ? 1 : -1) * myLength;

                    // Adjust position but keep it within viewport dimensions
                    position[side1] += overflow1 > 0 ? overflow1 : overflow2 > 0 ? -overflow2 : 0;
                    position[side1] = Math.max(
                        -containerOffset[side1] + viewportOffset[side1],
                        initialPos - offset,
                        Math.min(
                            Math.max(
                                -containerOffset[side1] + viewportOffset[side1] + (lengthName === WIDTH ? viewportWidth : viewportHeight),
                                initialPos + offset
                            ),
                            position[side1],

                            // Make sure we don't adjust complete off the element when using 'center'
                            mySide === 'center' ? initialPos - myLength : 1E9
                        )
                    );

                }

                // flip/flipinvert
                else {
                    // Update adjustment amount depending on if using flipinvert or flip
                    adjust *= (type === FLIPINVERT ? 2 : 0);

                    // Check for overflow on the left/top
                    if (overflow1 > 0 && (mySide !== side1 || overflow2 > 0)) {
                        position[side1] -= offset + adjust;
                        newMy.invert(side, side1);
                    }

                    // Check for overflow on the bottom/right
                    else if (overflow2 > 0 && (mySide !== side2 || overflow1 > 0)) {
                        position[side1] -= (mySide === CENTER ? -offset : offset) + adjust;
                        newMy.invert(side, side2);
                    }

                    // Make sure we haven't made things worse with the adjustment and reset if so
                    if (position[side1] < viewportScroll && -position[side1] > overflow2) {
                        position[side1] = initialPos;
                        newMy = my.clone();
                    }
                }

                return position[side1] - initialPos;
            }

            // Set newMy if using flip or flipinvert methods
            if (methodX !== 'shift' || methodY !== 'shift') {
                newMy = my.clone();
            }

            // Adjust position based onviewport and adjustment options
            adjusted = {
                left: methodX !== 'none' ? calculate(X, Y, methodX, adjust.x, LEFT, RIGHT, WIDTH, targetWidth, elemWidth) : 0,
                top: methodY !== 'none' ? calculate(Y, X, methodY, adjust.y, TOP, BOTTOM, HEIGHT, targetHeight, elemHeight) : 0
            };

            // Set tooltip position class if it's changed
            if (newMy && cache.lastClass !== (newClass = NAMESPACE + '-pos-' + newMy.abbrev())) {
                tooltip.removeClass(api.cache.lastClass).addClass((api.cache.lastClass = newClass));
            }

            return adjusted;
        };
    }));
}(window, document));