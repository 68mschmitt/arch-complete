import { NODE_TYPES } from '../types';
import InputNode from './InputNode';
import OutputNode from './OutputNode';
import FunctionNode from './FunctionNode';
import ConstantNode from './ConstantNode';
import CustomNodeReference from './CustomNodeReference';

export const nodeTypes = {
  [NODE_TYPES.INPUT]: InputNode,
  [NODE_TYPES.OUTPUT]: OutputNode,
  [NODE_TYPES.FUNCTION]: FunctionNode,
  [NODE_TYPES.CONSTANT]: ConstantNode,
  [NODE_TYPES.CUSTOM_REFERENCE]: CustomNodeReference,
};
