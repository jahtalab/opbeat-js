import { NgModule }       from '@angular/core';
import { BrowserModule }  from '@angular/platform-browser';
import { FormsModule }    from '@angular/forms';
import { AppComponent }       from './app.component';
import { routing,
  appRoutingProviders } from './app.routing';
import { HeroListComponent }    from './hero-list.component';
import { CrisisListComponent }  from './crisis-list.component';
import { HttpModule} from '@angular/http';

import {Opbeat} from './opbeat-ng2'

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    routing,
    HttpModule
  ],
  declarations: [
    AppComponent,
    HeroListComponent,
    CrisisListComponent
  ],
  providers: [
    appRoutingProviders,
    Opbeat
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
