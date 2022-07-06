import { css } from "lit";

export const optionStyles = css`
  .option {
    align-items: center;
    background-color: var(--option-background-color, #fff);
    box-sizing: border-box;
    color: var(--option-color, #000);
    cursor: pointer;
    display: flex;
    font-family: var(--font-family, inherit);
    font-size: var(--font-size, 14px);
    font-weight: var(--font-weight, 400);
    min-height: var(--select-height, 44px);
    justify-content: flex-start;
    padding: var(--padding, 0 10px);
    width: 100%;
  }
  .option:not(.disabled):focus, .option:not(.disabled):not(.selected):hover {
    background-color: var(--hover-background-color, #e3e3e3);
    color: var(--hover-color, #000);
  }
  .selected {
    background-color: var(--selected-background-color, #e3e3e3);
    color: var(--selected-color, #000);
  }
  .selected p {
    text-align: left;
    width: 100%;
    margin: 0;
  }
  .selected p span {
    float: right;
  }
  .selected span:after {
    content: '\\2713';
    float: right;
    vertical-align: middle;
  }
  .disabled {
    background-color: var(--disabled-background-color, #e3e3e3);
    color: var(--disabled-color, #000);
    cursor: default;
  }
`;
