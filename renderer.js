//@ts-check

var electronAPI = /** @type {typeof import('./preload.js').electronAPI}*/(window['electronAPI']);
const back_log = (...args) => electronAPI.back_console(...args);


const getDOM_Block = (key) => {
  const parent = $(`#${key}`);
  const label = parent.find('.block__label');
  const slider = parent.find('.block__slider');
  const increase = parent.find('.block__increase');
  const decrease = parent.find('.block__decrease');
  // back_log(label.length, slider.length, increase.length)
  return { key, parent, decrease, increase, slider, label }
}
const blocks = {
  ctl: getDOM_Block('ctl'),
  xsf: getDOM_Block('xsf'),
}

const pressReleaseCallbacks = (action) => {
  let interval = null, timeout = null, held = false, cnt = 0;
  const onPress = () => {
    console.log('press')
    if (timeout || interval) return;
    action(++cnt);
    held = true;
    timeout = setTimeout(() => {
      held = false;
      interval = setInterval(() => action(++cnt), 80);
    }, 200);
  };
  const onRelease = () => {
    clearTimeout(timeout);
    clearInterval(interval);
    timeout = interval = null;
    cnt = 0;
    if (held) held = false;
  };
  return [onPress, onRelease];
}

const pressReleaseButton = (button, action) => {
  const [onPress, onRelease] = pressReleaseCallbacks(action);
  $(button).on('mousedown', onPress);
  $(button).on('mouseup', onRelease);
}
const pressReleaseKey = (elem, filter, action) => {
  const [onPress, onRelease] = pressReleaseCallbacks(action);
  $(elem).on('keydown', (event) => {
    if (!filter(event)) return;
    event.stopPropagation();
    onPress();
  });
  $(elem).on('keyup', (event) => {
    if (!filter(event)) return;
    event.stopPropagation();
    onRelease();
  });
}

for (let block of Object.values(blocks)) {
  pressReleaseButton(block.increase, (cnt) => {
    electronAPI.back_update(block.key, Math.pow(cnt, 1.2) / 100, 'add');
    $(block.parent).trigger('focus');
  });
  pressReleaseButton(block.decrease, (cnt) => {
    electronAPI.back_update(block.key, -Math.pow(cnt, 1.2) / 100, 'add');
    $(block.parent).trigger('focus');
  });

  (() => {
    let changedInUI = true;
    let effect = null;

    electronAPI.front_value((_key, value) => {
      console.log(_key, value);
      if (_key != block.key) return
      const percent = value * 100;
      changedInUI = false;
      $(block.slider).val(percent);
      changedInUI = true;
      $(block.label).text(`${percent.toFixed(percent == 0 || percent >= 1 ? 0 : percent < 0.1 ? 3 : 2)} %`);
      $(block.label).addClass("bold-animation");
      if (effect) {
        clearTimeout(effect);
        $(block.label).addClass("bold-animation-hold");
        effect = setTimeout(() => {
          $(block.label).addClass("bold-animation");
          $(block.label).removeClass("bold-animation-hold");
          effect = setTimeout(() => { $(block.label).removeClass("bold-animation"), effect = null; }, 200);
        }, 100);
      } else {
        effect = setTimeout(() => { $(block.label).removeClass("bold-animation"), effect = null; }, 200);
      }
    });

    $(block.slider).on('input', () => {
      let percent = parseInt('' + $(block.slider).val());
      if (Number.isNaN(percent)) percent = 50;
      if (changedInUI) {
        electronAPI.back_update(block.key, percent / 100, 'set');
        $(block.label).text(`${percent} %`);
        $(block.parent).trigger('focus');
      }
    });
  })();
  $(block.slider).on('focus', () => {
    block.parent.trigger('focus');
  });
  pressReleaseKey(block.parent, (e) => e.key == 'ArrowLeft', (cnt) => electronAPI.back_update(block.key, -Math.pow(cnt, 1.2) / 100, 'add'));
  pressReleaseKey(block.parent, (e) => e.key == 'ArrowRight', (cnt) => electronAPI.back_update(block.key, +Math.pow(cnt, 1.2) / 100, 'add'));
}

let focused = 'ctl';
$(blocks[focused].parent).trigger('focus');

$('#container').on('click', () => $((blocks[focused]||{}).parent).trigger('focus'));
electronAPI.front_focus(()=> $((blocks[focused]||{}).parent).trigger('focus'));

$(document).on('keydown', (event) => {
  // back_log(event.key)
  if (event.key == 'ArrowDown' || event.key == 'ArrowUp') {
    focused = focused != 'ctl' ? 'ctl' : 'xsf';
    $(blocks[focused].parent).trigger('focus');
  }
  if (event.key == 'Escape') {
    electronAPI.back_hide();
  }
})
