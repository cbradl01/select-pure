import { boundMethod } from "autobind-decorator";
import { LitElement, html } from "lit";
import { ifDefined } from "lit-html/directives/if-defined.js";
import { customElement } from "lit/decorators/custom-element.js";
import { property } from "lit/decorators/property.js";
import { query } from "lit/decorators/query.js";

import { KEYS, defaultOption } from "./../constants";
import { Option, OptionPureElement } from "./../models";
import { selectStyles } from "./../styles";

@customElement("select-pure")
export class SelectPure extends LitElement {
  static get styles() {
    return selectStyles;
  }

  @property() options: Option[] = [];
  @property() visible: boolean = false;
  @property() selectedOption: Option = defaultOption;
  @property() _selectedOptions: Option[] = [];
  @property() disabled: boolean = false;
  @property() isMultipleSelect: boolean = false;
  @property() name: string = "";
  @property() _id: string = "";
  @property() formName: string = "";
  @property() value: string = "";
  @property() values: string[] = [];
  @property() defaultLabel: string = "";
  @property() totalRenderedChildOptions: number = -1;
  @query("select") nativeSelect!: HTMLSelectElement;

  private form: HTMLFormElement | null = null;
  private hiddenInput: HTMLInputElement | null = null;


  connectedCallback() {
    super.connectedCallback();

    this.disabled = this.getAttribute("disabled") !== null;
    this.isMultipleSelect = this.getAttribute("multiple") !== null;
    this.name = this.getAttribute("name") || "";
    this._id = this.getAttribute("id") || "";
    this.formName = this.name || this.id;
    this.defaultLabel = this.getAttribute("default-label") || "";
  }

  public open() {
    if (this.disabled) {
      return;
    }
    this.visible = true;
    this.removeEventListeners();
    document.body.addEventListener("click", this.close, true);
  }

  @boundMethod
  public close(event?: Event) {
    // @ts-ignore
    if (event && this.contains(event.target)) {
      return;
    }
    this.visible = false;
    this.removeEventListeners();
  }

  public enable() {
    this.disabled = false;
  }

  public disable() {
    this.disabled = true;
  }

  get selectedIndex(): number | undefined {
    return this.nativeSelect?.selectedIndex;
  }

  set selectedIndex(newSelectedIndex: number | undefined) {
    if (!newSelectedIndex && newSelectedIndex !== 0) {
      return;
    }
    this.selectOptionByValue(this.options[newSelectedIndex].value);
  }

  get selectedOptions() {
    return this.nativeSelect?.selectedOptions;
  }

  render() {
    const labelClassNames = ["label"];
    if (this.disabled) {
      labelClassNames.push("disabled");
    }
    if (this.visible) {
      labelClassNames.push("visible");
    }

    return html`
      <div class="select-wrapper">
        <select
          @change=${this.handleNativeSelectChange}
          ?disabled=${this.disabled}
          ?multiple=${this.isMultipleSelect}
          name="${ifDefined(this.name || undefined)}"
          id=${ifDefined(this.id || undefined)}
          size="1"
        >
          ${this.getNativeOptionsHtml()}
        </select>
        <div class="select">
          <div
            class="${labelClassNames.join(" ")}"
            @click="${this.visible ? this.close : this.open}"
            @keydown="${this.openDropdownIfProperKeyIsPressed}"
            tabindex="0"
          >
            ${this.getDisplayedLabel()}
          </div>
          <div class="dropdown${this.visible ? " visible" : ""}">
            <slot @slotchange=${this.initializeSelect}></slot>
          </div>
        </div>
      </div>
    `;
  }

  private handleNativeSelectChange() {
    this.selectedIndex = this.nativeSelect?.selectedIndex;
  }

  private getNativeOptionsHtml() {
    return this.options.map(this.getSingleNativeOptionHtml);
  }

  @boundMethod
  private getSingleNativeOptionHtml({ value, label, hidden, disabled }: Option) {
    return html`
      <option
        value=${value}
        ?selected=${this.isOptionSelected(value)}
        ?hidden=${hidden}
        ?disabled=${disabled}
      >
        ${label}
      </option>
    `;
  }

  private isOptionSelected(value: String): boolean {
    let isOptionSelected = this.selectedOption.value === value;
    if (this.isMultipleSelect) {
      isOptionSelected = Boolean(this._selectedOptions.find(option => option.value === value));
    }
    return isOptionSelected;
  }

  private openDropdownIfProperKeyIsPressed(event: KeyboardEvent) {
    if (event.key === KEYS.ENTER || event.key === KEYS.TAB) {
      this.open();
    }
  }

  private getDisplayedLabel() {
    if (this.isMultipleSelect && this._selectedOptions.length) {
      return this.getMultiSelectLabelHtml();
    }

    return this.selectedOption.label || this.defaultLabel;
  }

  @boundMethod
  private getMultiSelectLabelHtml() {
    if (this._selectedOptions.length>1){
      return this._selectedOptions.length + " choices selected"
    } else {
      return html`
        <div class="multi-selected-wrapper">
          ${this._selectedOptions.map(this.getMultiSelectSelectedOptionHtml)}
        </div>
      `;
    }
  }

  @boundMethod
  private getMultiSelectSelectedOptionHtml({ label, value }: Option) {
    return html`
//       <span class="multi-selected">
      <span>
        ${label}
//         <span
//           class="cross"
//           @click=${(event: Event) => this.fireOnSelectCallback(event, value)}
//         >
//         </span>
      </span>
    `;
  }

  private fireOnSelectCallback(event: Event, value: string) {
    event.stopPropagation();
    this.selectOptionByValue(value);
  }

  @boundMethod
  private initializeSelect() {
    this.processChildOptions();
    this.selectDefaultOptionIfNoneSelected();
    this.appendHiddenInputToClosestForm();
  }

  private processChildOptions() {
    const options = this.querySelectorAll("option-pure");
    this.totalRenderedChildOptions = options.length;
    for (let i = 0; i < options.length; i++) {
      this.initializeSingleOption(options[i] as OptionPureElement, i);
    }
  }

  private selectDefaultOptionIfNoneSelected() {
    const shouldSelectDefaultOption = !this.selectedOption.value && !this.isMultipleSelect && this.options.length;
    if (shouldSelectDefaultOption) {
      this.selectOptionByValue(this.options[0].value);
    }
  }

  @boundMethod
  private initializeSingleOption(optionElement: OptionPureElement, optionIndex: number) {
    optionElement.setOnSelectCallback(this.selectOptionByValue);
    this.options[optionIndex] = optionElement.getOption();
    if (this.options[optionIndex].selected) {
      this.selectOptionByValue(this.options[optionIndex].value);
    }
  }

  @boundMethod
  private removeEventListeners() {
    document.body.removeEventListener("click", this.close);
  }

  @boundMethod
  private appendHiddenInputToClosestForm() {
    this.form = this.closest("form");
    if (!this.form || this.hiddenInput) {
      return;
    }
    this.hiddenInput = document.createElement("input");
    this.hiddenInput.setAttribute("type", "hidden");
    this.hiddenInput.setAttribute("name", this.formName);
    this.form.appendChild(this.hiddenInput);
  }

  private unselectAllOptions() {
    for (let i = 0; i < this.options.length; i++) {
      this.options[i].unselect();
    }
  }

  @boundMethod
  private selectOptionByValue(newOptionValue: string) {
    const option = this.options.find(({ value }) => value === newOptionValue);
    if (!option) {
      return;
    }
    this.setSelectValue(option);
  }

  private setSelectValue(optionToBeSelected: Option) {
    if (this.isMultipleSelect) {
      this.setMultiSelectValue(optionToBeSelected);
    } else {
      this.setSingleSelectValue(optionToBeSelected);
    }
    this.updateHiddenInputInForm();
    this.dispatchChangeEvent();
  }

  private dispatchChangeEvent() {
    this.dispatchEvent(new Event("change"));
  }

  private setMultiSelectValue(optionToBeSelected: Option) {
    const indexInSelectedOptions = this._selectedOptions.indexOf(optionToBeSelected);
    const isAlreadySelected = indexInSelectedOptions !== -1;
    if (isAlreadySelected) {
      this.values.splice(indexInSelectedOptions, 1);
      this._selectedOptions.splice(indexInSelectedOptions, 1);
      optionToBeSelected.unselect();
    } else {
      this.values.push(optionToBeSelected.value);
      this._selectedOptions.push(optionToBeSelected);
      optionToBeSelected.select();
    }
    this.requestUpdate();
  }

  private setSingleSelectValue(optionToBeSelected: Option) {
    this.unselectAllOptions();
    this.close();
    this.selectedOption = optionToBeSelected;
    this.value = optionToBeSelected.value;
    optionToBeSelected.select();
  }

  private updateHiddenInputInForm() {
    if (!this.form || !this.hiddenInput) {
      return;
    }
    this.hiddenInput.value = this.isMultipleSelect ? this.values.join(",") : this.value;
    const event = new Event("change", { bubbles: true });
    this.hiddenInput.dispatchEvent(event);
  }
}
