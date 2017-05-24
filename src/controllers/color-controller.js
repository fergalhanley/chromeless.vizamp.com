
import colorSchemes from '../data/color-schemes.json';

class ColorController {

    canvas = null;

    initialize(cnvs, viz) {
        this.canvas = cnvs;
        this.applyFilter(viz);
    }

    /**
     * Generates a function that can create a color from a custom set of parameters. The color generation script is
     * provided by a service so it needs to be parsed and sanitized. The function must also allow for passing of custom
     * parameters in order to allow simplifying the input script (also slightly faster execution).
     * The input script is restricted to allowing assignment, expressions and calling Math functions. Due to the security
     * sensitivity around generating executable code inputted by the user, the script is sanitized at multiple points:
     *  - In the browser when posted to the rest api and when being used and converted to a function
     *  - On the server when being saved and also when returned in a rest call.
     *
     * @param index
     * @param customParams
     * @param output
     * @returns Function object for generating an rgba color value
     */
    getColorFunc(index, customParams, output) {
      customParams = customParams || [];
      output = output || 'rgba-string'; // 'rgba-string' | 'rgb-string' | 'object'
      index %= colorSchemes.length;
      const cs = colorSchemes[index];

      function genColorStr(target, omitAlpha) {
        let r, g, b, a = '" + opacity + "';
        switch(target) {
          case '2d-draw' :
            r = wrap('red * Math.abs(colorForm)');
            g = wrap('green * Math.abs(colorForm)');
            b = wrap('blue * Math.abs(colorForm)');
            break;
          case '2d-background' :
            r = wrap('red');
            g = wrap('green');
            b = wrap('blue');
            break;
        }
        if(omitAlpha) {
            return `rgb(${r}, ${g}, ${b})`;
        }
        else {
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
      }

      function genRgbObj(target) {
        switch(target) {
          case '2d-draw' :       return '{ r: red, g: green, b: blue, a: opacity }';
          case '2d-background' : return '{ r: red, g: green, b: blue, a: opacity }';
        }
      }

      // couple of wrap functions for the sake of readability
      function wrap(val) {
        return `" + Math.floor(${val}) + "`;
      }

      function quotify(vals) {
        for (let i = 0; i < vals.length; i++) {
          vals[i] = `'${vals[i]}'`;
        }
        return vals;
      }

      let colorStr;
      switch(output) {
        case 'rgba-string' :
          colorStr = genColorStr(cs.target);
          break;
        case 'rgb-string' :
          colorStr = genColorStr(cs.target, true);
          break;
        default : // 'object'
            colorStr = genRgbObj(cs.target);
          break;
      }

        let calcColorScript =
            `var red = 0, green = 0, blue = 0;
         ${cs.script};
         return ${colorStr}`;

        // default parameters provided to color function for all viz types. Caller needs to be aware of the order
      const params = quotify([ 'w', 'h', 'x1', 'y1', 'x2', 'y2', 'colorForm', 'opacity', 'i', 't', 'r' ]
          .concat(customParams));

      try {
        // crate a function declaration that takes custom parameters
        const funcGenScript = `return Function(${params.join(',')}, script)`;
        const functionGenerator = new Function('script', funcGenScript);
        return functionGenerator(calcColorScript);
      }
      catch (e) {
        console.error(e.message);
      }
    }
    
    /**
     * A linear expression for determining the curvature of the opacity runoff
     * @param mx
     * @param nx
     * @param opacityFactor
     * @returns {number}
     */
    calcOpacityCurve(mx, nx, opacityFactor) {
      const x = (mx + 1) / nx;
      const y1 = -0.5;
      const y2 = 0.5;
      const y3 = opacityFactor || 2;
      return ((y1 * x * x) + (y2 * x)) * y3;
    }

    // todo get rid of this if possible
    getColorSchemes(target) {
      const retval = [];
      for (let i = 0; i < colorSchemes.length; i++) {
        const cs = colorSchemes[i];
        if(target === cs.target) {
          retval.push(cs.name);
        }
      }
      return retval;
    }
}

const colorController = new ColorController();

export default colorController;
