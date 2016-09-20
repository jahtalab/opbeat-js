import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';
import {bootstrap} from './opbeat-ng2'
bootstrap(function () {
  
  platformBrowserDynamic().bootstrapModule(AppModule);
})
