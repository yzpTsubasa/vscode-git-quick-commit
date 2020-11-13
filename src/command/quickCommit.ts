import quickCommit from '../lib/quickCommit';
import {ICommand} from './Command';



const cmd: ICommand = function() {
  let options = {showDialog: false};
  return quickCommit(options);
};

export default cmd;